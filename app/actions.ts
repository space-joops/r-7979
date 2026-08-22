"use server";

// 푸시 구독 등록/해제 서버 액션.
// 인증 없음(쓰기 전용, endpoint 해시가 키) — 구독 객체 자체가 비밀값이라 열람 API는 없다.

import { createHash } from "node:crypto";
import { getRedis, PUSH_SUBS_KEY } from "@/lib/redis";

interface PushSubscriptionJson {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

function endpointHash(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

function isValidSubscription(sub: unknown): sub is PushSubscriptionJson {
  if (typeof sub !== "object" || sub === null) return false;
  const s = sub as PushSubscriptionJson;
  return (
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    s.endpoint.length < 1024 &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}

export async function subscribeUser(
  sub: unknown,
): Promise<{ ok: boolean }> {
  if (!isValidSubscription(sub)) return { ok: false };
  await getRedis().hset(PUSH_SUBS_KEY, {
    [endpointHash(sub.endpoint)]: JSON.stringify(sub),
  });
  return { ok: true };
}

export async function unsubscribeUser(
  endpoint: string,
): Promise<{ ok: boolean }> {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false };
  }
  await getRedis().hdel(PUSH_SUBS_KEY, endpointHash(endpoint));
  return { ok: true };
}
