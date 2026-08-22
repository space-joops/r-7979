"use client";

// 퍼널 오케스트레이터 — 감지/계측/표면 선택을 한곳에서 관리.
// 동시에 하나의 표면만 노출: 탈출 > 설치 > 알림.

import { useEffect, useState } from "react";
import { track } from "@/lib/funnel/analytics";
import {
  detectInAppBrowser,
  detectPlatform,
  isStandalone,
  type InAppName,
  type Platform,
} from "@/lib/funnel/env";
import { ensureSchema, funnelStorage, sessionFlags } from "@/lib/funnel/storage";
import { InAppBrowserGuard } from "./InAppBrowserGuard";
import { InstallPrompt } from "./InstallPrompt";
import { RaceDayNotify } from "./RaceDayNotify";

/** beforeinstallprompt 이벤트 (표준 타입 미제공) */
export interface BipEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Surface = "escape" | "install" | "notify" | null;

interface FunnelState {
  surface: Surface;
  inApp: Exclude<InAppName, null> | null;
  platform: Platform;
}

const INSTALL_DWELL_MS = 15_000;

export function FunnelProvider() {
  const [state, setState] = useState<FunnelState | null>(null);
  const [bip, setBip] = useState<BipEvent | null>(null);

  // BIP는 하이드레이션 직후 바로 캡처 (배너 표시 여부와 무관)
  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BipEvent);
      track("install_prompt_available");
    };
    window.addEventListener("beforeinstallprompt", onBip);
    const onInstalled = () => {
      funnelStorage.set("installed", "1");
      track("app_installed");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    ensureSchema();
    const ua = navigator.userAgent;
    const inApp = detectInAppBrowser(ua);
    const platform = detectPlatform(ua);
    const standalone = isStandalone();

    // --- 세션/최초 이벤트 ---
    if (!funnelStorage.get("first_seen")) {
      funnelStorage.touch("first_seen");
      const url = new URL(location.href);
      const source =
        url.searchParams.get("utm_source") ?? url.searchParams.get("source") ?? "";
      funnelStorage.setJson("attribution", {
        source,
        medium: url.searchParams.get("utm_medium") ?? "",
        referrer: document.referrer,
        landing_path: url.pathname,
        inapp_name: inApp ?? "none",
        ts: new Date().toISOString(),
      });
      track("funnel_first_visit", {
        source: source || "(none)",
        medium: url.searchParams.get("utm_medium") ?? "(none)",
        referrer_host: document.referrer
          ? new URL(document.referrer).hostname
          : "(direct)",
      });
    }
    if (!sessionFlags.get("session_counted")) {
      sessionFlags.set("session_counted");
      funnelStorage.increment("visit_count");
      if (standalone) {
        track("standalone_launch");
        // iOS는 appinstalled 이벤트가 없어 standalone 실행으로 설치를 추론
        if (!funnelStorage.get("installed")) {
          funnelStorage.set("installed", "1");
          track("app_installed", { inferred: "ios" });
        }
      }
      if (inApp) track("inapp_detected");
    }

    // --- 랜딩 파라미터 계측 ---
    const url = new URL(location.href);
    let dirty = false;
    if (url.searchParams.get("escaped") === "1") {
      if (!inApp && !funnelStorage.get("escaped")) {
        funnelStorage.set("escaped", "1");
        track("inapp_escape_landed", {
          method: url.searchParams.get("method") ?? "(unknown)",
        });
      }
      url.searchParams.delete("escaped");
      url.searchParams.delete("method");
      dirty = true;
    }
    if (url.searchParams.get("push") === "1") {
      track("push_click", { tag: url.searchParams.get("tag") ?? "(none)" });
      url.searchParams.delete("push");
      url.searchParams.delete("tag");
      dirty = true;
    }
    if (dirty) history.replaceState(null, "", url.href.replace(/\?$/, ""));

    // --- 표면 결정 ---
    const base: Omit<FunnelState, "surface"> = { inApp, platform };
    if (inApp && !sessionFlags.get("escape_dismissed")) {
      // SSR에서는 감지 불가 → 마운트 후 1회 상태 확정 (의도된 패턴, 캐스케이드 없음)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ ...base, surface: "escape" });
      return;
    }
    if (standalone) {
       
      setState({ ...base, surface: "notify" });
      return;
    }
    // 설치 배너: 데스크톱 제외, 미설치, 빈도 캡 통과 시 15초 체류 후
    const installEligible =
      platform !== "desktop" &&
      !funnelStorage.get("installed") &&
      funnelStorage.getNumber("install_dismiss_count") < 3 &&
      funnelStorage.olderThanDays("install_last_dismissed_at", 7);
    if (installEligible) {
      const timer = setTimeout(
        () => setState({ ...base, surface: "install" }),
        INSTALL_DWELL_MS,
      );
      return () => clearTimeout(timer);
    }
  }, []);

  if (!state) return null;

  if (state.surface === "escape" && state.inApp) {
    return (
      <InAppBrowserGuard
        inApp={state.inApp}
        platform={state.platform}
        onDismiss={() => {
          sessionFlags.set("escape_dismissed");
          setState({ ...state, surface: null });
        }}
      />
    );
  }
  if (state.surface === "install") {
    return (
      <InstallPrompt
        platform={state.platform}
        bip={bip}
        onDismiss={() => {
          funnelStorage.increment("install_dismiss_count");
          funnelStorage.touch("install_last_dismissed_at");
          setState({ ...state, surface: null });
        }}
      />
    );
  }
  if (state.surface === "notify") {
    return <RaceDayNotify onDismiss={() => setState({ ...state, surface: null })} />;
  }
  return null;
}
