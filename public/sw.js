// 오늘의 경마 서비스 워커 — 경마일 로컬 알림 전용.
// fetch/오프라인 캐싱 없음(의도적) — 콘텐츠는 항상 네트워크에서 최신으로.
//
// periodicsync는 Android Chrome(설치된 PWA + 사이트 참여도) 전용이며 발화 시점은
// 브라우저 재량이다. iOS는 웹 표준상 예약 로컬 알림이 불가 — 앱 내 배너로 대체.
// 정확한 시간 보장이 필요해지면 서버 Web Push로 업그레이드(Phase 3).
//
// 경마일: 일=서울·부산경남 / 금=부산경남·제주 / 토=서울·제주 (lib/funnel/race-days.ts와 동일)

const RACE_DAY_TRACKS = {
  0: ["서울", "부산경남"],
  5: ["부산경남", "제주"],
  6: ["서울", "제주"],
};
const RACE_DAY_TAGS = { 0: "race_day_sun", 5: "race_day_fri", 6: "race_day_sat" };

const MARKER_CACHE = "raceday-notified";

function kstToday() {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return {
    weekday: kst.getUTCDay(),
    ymd: kst.toISOString().slice(0, 10),
  };
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "race-day-check") return;
  event.waitUntil(maybeNotifyRaceDay());
});

async function maybeNotifyRaceDay() {
  const { weekday, ymd } = kstToday();
  const tracks = RACE_DAY_TRACKS[weekday];
  if (!tracks) return; // 비경마일

  // 당일 중복 알림 방지 마커 (SW에는 localStorage가 없어 Cache API 사용)
  const cache = await caches.open(MARKER_CACHE);
  const marker = await cache.match("/last-notified");
  if (marker && (await marker.text()) === ymd) return;

  const tag = RACE_DAY_TAGS[weekday];
  await self.registration.showNotification("오늘은 경마일입니다 🏇", {
    body: `${tracks.join("·")} 경마가 열리는 날이에요. 출마표를 확인해보세요.`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    data: { url: `/?push=1&tag=${tag}` },
  });
  await cache.put("/last-notified", new Response(ymd));
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
