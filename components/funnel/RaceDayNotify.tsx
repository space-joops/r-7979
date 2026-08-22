"use client";

// 경마일 알림 — 설치된(standalone) 앱 전용.
// 1) 오늘이 경마일이면 인앱 배너 표시 (모든 플랫폼 — iOS 포함)
// 2) Android: Periodic Background Sync 등록으로 경마일 아침 로컬 알림 시도.
//    발화 시점은 브라우저 재량(참여도 기반)이며 iOS는 웹 표준상 예약 로컬 알림이
//    불가능하다 — 정확한 시간 보장이 필요해지면 서버 Web Push(Phase 3)로 업그레이드.

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/funnel/analytics";
import { todaysRacing } from "@/lib/funnel/race-days";
import { funnelStorage, sessionFlags } from "@/lib/funnel/storage";

type PermissionState = "default" | "granted" | "denied";

interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register(tag: string, options: { minInterval: number }): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

async function registerPeriodicSync(): Promise<boolean> {
  try {
    const registration = (await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })) as PeriodicSyncRegistration;
    if (!registration.periodicSync) return false;
    const status = await navigator.permissions.query({
      // 타입 정의에 없는 최신 권한명
      name: "periodic-background-sync" as PermissionName,
    });
    if (status.state !== "granted") return false;
    await registration.periodicSync.register("race-day-check", {
      minInterval: 12 * 60 * 60 * 1000,
    });
    return true;
  } catch {
    return false;
  }
}

export function RaceDayNotify({ onDismiss }: { onDismiss: () => void }) {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [racing] = useState(() => todaysRacing());
  const [showOptIn, setShowOptIn] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    // SSR에서는 권한 상태를 알 수 없음 → 마운트 후 1회 확정 (의도된 패턴)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(Notification.permission);
    // 소프트 요청 빈도 캡: 최대 2회, 14일 쿨다운, 하드 거부 시 영구 중단
    const status = funnelStorage.get("notify_status");
    const eligible =
      Notification.permission === "default" &&
      status !== "declined_soft" &&
      funnelStorage.getNumber("notify_ask_count") < 2 &&
      funnelStorage.olderThanDays("notify_last_shown_at", 14);
    if (eligible && !sessionFlags.get("notify_shown")) {
      sessionFlags.set("notify_shown");
      funnelStorage.touch("notify_last_shown_at");
      funnelStorage.increment("notify_ask_count");
       
      setShowOptIn(true);
      track("notify_optin_shown");
    }
  }, []);

  const requestPermission = async () => {
    track("notify_permission_requested");
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    funnelStorage.set("notify_status", result);
    if (result === "granted") {
      track("notify_permission_granted");
      const registered = await registerPeriodicSync();
      if (registered) track("periodicsync_registered");
    } else if (result === "denied") {
      track("notify_permission_denied");
    }
    setShowOptIn(false);
  };

  // 이미 허용된 상태면 조용히 periodic sync 재등록 (설치 직후 1회성 등록 유실 대비)
  useEffect(() => {
    if (permission === "granted") void registerPeriodicSync();
  }, [permission]);

  // 오늘이 경마일이면 배너 (iOS 포함 전 플랫폼 — 예약 알림의 대체 수단)
  if (racing && !sessionFlags.get("raceday_banner_dismissed")) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm">
            🏇 오늘은 <strong>{racing.tracks.join("·")}</strong> 경마일입니다
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/racecard"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-background"
            >
              출마표 보기
            </Link>
            <button
              type="button"
              aria-label="닫기"
              onClick={() => {
                sessionFlags.set("raceday_banner_dismissed");
                onDismiss();
              }}
              className="px-2 text-foreground/50"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOptIn) {
    return (
      <div
        role="dialog"
        aria-label="경마일 알림 안내"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-foreground/10 bg-background p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
      >
        <h2 className="text-base font-bold">경마일 알림을 받아보세요</h2>
        <p className="mt-1 text-sm text-foreground/70">
          경마일(금·토·일) 아침에 개최 경마장을 알려드려요.
        </p>
        <button
          type="button"
          onClick={requestPermission}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-background"
        >
          알림 받기
        </button>
        <button
          type="button"
          onClick={() => {
            funnelStorage.set("notify_status", "declined_soft");
            setShowOptIn(false);
            onDismiss();
          }}
          className="mt-3 w-full px-4 py-2 text-sm text-foreground/50"
        >
          다음에 할게요
        </button>
      </div>
    );
  }

  return null;
}
