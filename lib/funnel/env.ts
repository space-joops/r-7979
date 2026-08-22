// 실행 환경 감지 — 인앱브라우저/플랫폼/standalone 판별과 탈출 전략.
// 클라이언트 전용 (window 접근). 미지의 인앱브라우저는 일반 브라우저로 취급(fail open).

export type InAppName =
  | "kakaotalk"
  | "naver"
  | "instagram"
  | "facebook"
  | "line"
  | "daum"
  | "everytime"
  | "kakaostory"
  | "band"
  | null;

export type Platform = "ios" | "android" | "desktop";

// 순서 중요: 더 구체적인 패턴을 먼저 매칭
const IN_APP_PATTERNS: { name: Exclude<InAppName, null>; regex: RegExp }[] = [
  { name: "kakaotalk", regex: /KAKAOTALK/i },
  { name: "kakaostory", regex: /KAKAOSTORY/i },
  { name: "naver", regex: /NAVER\(inapp/i },
  { name: "instagram", regex: /Instagram/i },
  { name: "facebook", regex: /FBAN|FBAV|FB_IAB/i },
  { name: "line", regex: /\bLine\//i },
  { name: "daum", regex: /DaumApps|DaumDevice/i },
  { name: "everytime", regex: /everytimeApp/i },
  { name: "band", regex: /; BAND\b/i },
];

export function detectInAppBrowser(ua: string): InAppName {
  for (const { name, regex } of IN_APP_PATTERNS) {
    if (regex.test(ua)) return name;
  }
  return null;
}

export function detectPlatform(ua: string): Platform {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS 13+는 Mac UA로 위장 — 터치포인트로 구분
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  return "desktop";
}

export type IosBrowser = "safari" | "chrome" | "other";

/** iOS에서 실제 사용 중인 브라우저 구분 — 설치 안내 문구가 브라우저마다 다르다 */
export function detectIosBrowser(ua: string): IosBrowser {
  if (/CriOS/i.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS|whale/i.test(ua)) return "other";
  return "safari";
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari 전용 속성
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export type EscapeMethod =
  | "kakao_external"
  | "line_param"
  | "android_intent"
  | "ios_safari_scheme"
  | "copy_url";

export interface EscapeStrategy {
  method: EscapeMethod;
  /** 원클릭 이동 URL. copy_url 전략이면 없음 */
  url?: string;
  /** iOS 수동 폴백 안내가 함께 필요한지 */
  needsManualFallback: boolean;
}

/** 현재 URL에 escaped=1을 붙여 반환 (랜딩 계측용) */
function withEscaped(url: URL): URL {
  const escaped = new URL(url);
  escaped.searchParams.set("escaped", "1");
  return escaped;
}

export function getEscapeStrategy(
  inApp: Exclude<InAppName, null>,
  platform: Platform,
  currentUrl: string,
): EscapeStrategy {
  const url = withEscaped(new URL(currentUrl));

  if (inApp === "kakaotalk" || inApp === "kakaostory") {
    return {
      method: "kakao_external",
      url: `kakaotalk://web/openExternal?url=${encodeURIComponent(url.href)}`,
      needsManualFallback: false,
    };
  }
  if (inApp === "line") {
    url.searchParams.set("openExternalBrowser", "1");
    return { method: "line_param", url: url.href, needsManualFallback: false };
  }
  if (platform === "android") {
    return {
      method: "android_intent",
      url: `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.href)};end`,
      needsManualFallback: false,
    };
  }
  if (platform === "ios") {
    // 일부 인앱에서만 동작 — 성공률은 GA(inapp_escape_landed)로 측정, 수동 폴백 상시 병행
    return {
      method: "ios_safari_scheme",
      url: `x-safari-${url.href}`,
      needsManualFallback: true,
    };
  }
  return { method: "copy_url", needsManualFallback: true };
}
