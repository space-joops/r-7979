"use client";

// 인앱브라우저 감지 시 외부 브라우저로 유도하는 바텀시트.
// 카카오톡/LINE/Android는 원클릭, iOS 기타 인앱은 시도+수동 폴백을 정직하게 병행.

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/funnel/analytics";
import {
  getEscapeStrategy,
  type InAppName,
  type Platform,
} from "@/lib/funnel/env";

const BROWSER_LABEL: Record<Platform, string> = {
  ios: "Safari로 열기",
  android: "Chrome으로 열기",
  desktop: "브라우저에서 열기",
};

export function InAppBrowserGuard({
  inApp,
  platform,
  onDismiss,
}: {
  inApp: Exclude<InAppName, null>;
  platform: Platform;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const strategy = useMemo(
    () => getEscapeStrategy(inApp, platform, location.href),
    [inApp, platform],
  );

  useEffect(() => {
    track("inapp_escape_shown", { method: strategy.method });
  }, [strategy.method]);

  const escape = () => {
    track("inapp_escape_click", { method: strategy.method });
    if (strategy.url) {
      // 랜딩 계측용 method 파라미터를 심어 이동
      location.href = strategy.url.includes("escaped=1")
        ? strategy.url.replace("escaped=1", `escaped=1&method=${strategy.method}`)
        : strategy.url;
    }
  };

  const copyUrl = async () => {
    track("inapp_escape_click", { method: "copy_url" });
    const url = new URL(location.href);
    url.searchParams.set("escaped", "1");
    url.searchParams.set("method", "copy_url");
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      // 클립보드 미지원 인앱 — 프롬프트로 폴백
      window.prompt("아래 주소를 복사하세요", url.href);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="외부 브라우저 안내"
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-foreground/10 bg-background p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
    >
      <h2 className="text-base font-bold">
        외부 브라우저에서 열어주세요
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        지금은 앱 내부 브라우저라서 홈 화면 추가와 경마일 알림을 사용할 수
        없어요.
      </p>

      {strategy.url && (
        <button
          type="button"
          onClick={escape}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-background"
        >
          {BROWSER_LABEL[platform]}
        </button>
      )}

      {strategy.needsManualFallback && (
        <div className="mt-3 rounded-lg bg-foreground/5 p-3 text-sm text-foreground/80">
          <p>
            버튼이 동작하지 않으면: 화면 우측 하단(또는 상단){" "}
            <strong>⋯ 메뉴 → {platform === "ios" ? "Safari로 열기" : "다른 브라우저로 열기"}</strong>
          </p>
          <button
            type="button"
            onClick={copyUrl}
            className="mt-2 w-full rounded-lg border border-foreground/20 px-4 py-2 font-medium"
          >
            {copied ? "복사됨 ✓" : "주소 복사하기"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          track("inapp_escape_dismissed", { method: strategy.method });
          onDismiss();
        }}
        className="mt-3 w-full px-4 py-2 text-sm text-foreground/50"
      >
        그냥 볼게요
      </button>
    </div>
  );
}
