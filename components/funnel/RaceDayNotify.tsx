"use client";

// 경마일 알림 — 설치된(standalone) 앱 전용.
// 1) 오늘이 경마일이면 인앱 배너 표시 (모든 플랫폼 — iOS 포함)
// 2) 알림 허용 시 서버 Web Push 구독 (크론이 경마일 아침 KST 07시 발송 — iOS 16.4+ 포함)
// 3) Android는 Periodic Background Sync도 병행 등록 (같은 tag라 중복 알림 없음, 폴백)

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeUser } from "@/app/actions";
import { track } from "@/lib/funnel/analytics";
import { todaysRacing } from "@/lib/funnel/race-days";
import { funnelStorage, sessionFlags } from "@/lib/funnel/storage";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** 서버 Web Push 구독 → Redis 저장. 성공 여부 반환 */
async function subscribeWebPush(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey || !("pushManager" in registration)) return false;
  try {
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));
    const { ok } = await subscribeUser(
      JSON.parse(JSON.stringify(subscription)),
    );
    return ok;
  } catch {
    return false;
  }
}

type PermissionState = "default" | "granted" | "denied";

interface PeriodicSyncRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register(tag: string, options: { minInterval: number }): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

async function registerPeriodicSync(
  registration: PeriodicSyncRegistration,
): Promise<boolean> {
  try {
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

/** SW 등록 후 Web Push 구독 + PBS 폴백 등록. GA 이벤트 발화 포함 */
async function setupNotifications(emitEvents: boolean): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = (await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })) as PeriodicSyncRegistration;
    const pushed = await subscribeWebPush(registration);
    if (emitEvents) {
      track(pushed ? "push_subscribed" : "push_subscribe_failed");
    }
    const pbs = await registerPeriodicSync(registration);
    if (emitEvents && pbs) track("periodicsync_registered");
  } catch {
    if (emitEvents) track("push_subscribe_failed", { error_code: "sw_register" });
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
      await setupNotifications(true);
    } else if (result === "denied") {
      track("notify_permission_denied");
    }
    setShowOptIn(false);
  };

  // 이미 허용된 상태면 조용히 구독 상태 복구 (구독 만료/유실 대비, 이벤트 미발화)
  useEffect(() => {
    if (permission === "granted") void setupNotifications(false);
  }, [permission]);

  // 알림 옵트인이 자격을 얻었으면 경마일 배너보다 우선한다 —
  // 배너를 먼저 보여주면 닫는 순간 옵트인 기회가 사라지는 문제가 있었음.
  // (경마일 = 방문이 가장 많은 날 = 옵트인 전환이 가장 잘 되는 날)
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

  return null;
}
