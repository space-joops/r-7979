// 경마일 푸시 발송 — Vercel Cron이 매일 22:00 UTC(= KST 다음날 07:00)에 호출.
// KST 기준 금/토/일이 아니면 스킵. ?force=1(같은 시크릿)로 수동 테스트 가능.

import webpush from "web-push";
import { todaysRacing } from "@/lib/funnel/race-days";
import { getRedis, PUSH_SUBS_KEY } from "@/lib/redis";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 60;

let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidReady = true;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get("force") === "1";
  const racing = todaysRacing();
  if (!racing && !force) {
    return Response.json({ skipped: true, reason: "not a race day (KST)" });
  }

  const tracks = racing?.tracks ?? ["테스트"];
  const tag = racing?.tag ?? "race_day_test";
  const payload = JSON.stringify({
    title: "오늘은 경마일입니다 🏇",
    body: `${tracks.join("·")} 경마가 열리는 날이에요. 출마표를 확인해보세요.`,
    tag,
    url: `${SITE_URL}/?push=1&tag=${tag}`,
  });

  ensureVapid();
  const redis = getRedis();
  const subs = await redis.hgetall<Record<string, unknown>>(PUSH_SUBS_KEY);
  if (!subs || Object.keys(subs).length === 0) {
    return Response.json({ sent: 0, pruned: 0, failed: 0 });
  }

  let sent = 0;
  let pruned = 0;
  let failed = 0;
  await Promise.all(
    Object.entries(subs).map(async ([hash, raw]) => {
      try {
        // Upstash 클라이언트는 JSON을 자동 역직렬화할 수 있어 두 형태 모두 처리
        const sub = typeof raw === "string" ? JSON.parse(raw) : raw;
        await webpush.sendNotification(sub, payload);
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // 만료/해지된 구독은 정리
          await redis.hdel(PUSH_SUBS_KEY, hash);
          pruned += 1;
        } else {
          failed += 1;
        }
      }
    }),
  );

  return Response.json({ sent, pruned, failed, tag });
}
