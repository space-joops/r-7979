"use client";

// PWA 설치 유도 배너.
// Android: beforeinstallprompt 캡처 시 원탭 설치 버튼(문서는 비권장이지만 유일한 방법 —
// 피처 디텍트로 폴백 병행). iOS: 공유 → 홈 화면에 추가 안내.

import { useEffect } from "react";
import { track } from "@/lib/funnel/analytics";
import type { Platform } from "@/lib/funnel/env";
import { funnelStorage } from "@/lib/funnel/storage";
import type { BipEvent } from "./FunnelProvider";

export function InstallPrompt({
  platform,
  bip,
  onDismiss,
}: {
  platform: Platform;
  bip: BipEvent | null;
  onDismiss: () => void;
}) {
  const ui =
    platform === "ios" ? "ios_guide" : bip ? "android_button" : "android_manual";

  useEffect(() => {
    track("install_prompt_shown", { ui });
  }, [ui]);

  const install = async () => {
    if (!bip) return;
    track("install_prompt_click", { ui });
    await bip.prompt();
    const { outcome } = await bip.userChoice;
    if (outcome === "accepted") {
      track("install_accepted");
      funnelStorage.set("installed", "1");
    } else {
      track("install_dismissed");
    }
    onDismiss();
  };

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-foreground/10 bg-background p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
    >
      <h2 className="text-base font-bold">홈 화면에 추가하고 빠르게 확인하세요</h2>
      <p className="mt-1 text-sm text-foreground/70">
        앱처럼 바로 열고, 경마일(금·토·일) 알림도 받을 수 있어요.
      </p>

      {ui === "android_button" && (
        <button
          type="button"
          onClick={install}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-background"
        >
          앱 설치하기
        </button>
      )}

      {ui === "android_manual" && (
        <p className="mt-4 rounded-lg bg-foreground/5 p-3 text-sm">
          브라우저 메뉴(⋮)에서 <strong>홈 화면에 추가</strong>를 눌러주세요.
        </p>
      )}

      {ui === "ios_guide" && (
        <ol className="mt-4 space-y-2 rounded-lg bg-foreground/5 p-3 text-sm">
          <li>
            1. 하단 <strong>공유 버튼(􀈂 ⬆︎)</strong>을 탭
          </li>
          <li>
            2. <strong>홈 화면에 추가</strong>를 선택
          </li>
        </ol>
      )}

      <button
        type="button"
        onClick={() => {
          track("install_dismissed", { ui });
          onDismiss();
        }}
        className="mt-3 w-full px-4 py-2 text-sm text-foreground/50"
      >
        다음에 할게요
      </button>
    </div>
  );
}
