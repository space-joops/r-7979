// GA4 퍼널 이벤트 전송 — 모든 이벤트에 공통 파라미터(app_mode/platform/inapp_name) 자동 부착
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
  detectInAppBrowser,
  detectPlatform,
  isStandalone,
  type InAppName,
  type Platform,
} from "./env";

interface CommonParams {
  app_mode: "standalone" | "browser" | "inapp";
  platform: Platform;
  inapp_name: Exclude<InAppName, null> | "none";
}

let common: CommonParams | null = null;

function getCommon(): CommonParams {
  if (common) return common;
  const ua = navigator.userAgent;
  const inApp = detectInAppBrowser(ua);
  common = {
    app_mode: isStandalone() ? "standalone" : inApp ? "inapp" : "browser",
    platform: detectPlatform(ua),
    inapp_name: inApp ?? "none",
  };
  return common;
}

export function track(
  name: string,
  params: Record<string, string | number> = {},
): void {
  sendGAEvent("event", name, { ...getCommon(), ...params });
}
