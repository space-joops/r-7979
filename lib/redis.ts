// Upstash Redis 클라이언트 — 푸시 구독 저장용.
// 마켓플레이스가 주입하는 env 이름이 UPSTASH_* 또는 KV_* 두 계열일 수 있어 둘 다 지원.
// 빌드 타임 크래시 방지를 위해 지연 초기화.

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis env vars are not set");
  }
  _redis = new Redis({ url, token });
  return _redis;
}

/** 푸시 구독 해시 키 */
export const PUSH_SUBS_KEY = "push:subs";
