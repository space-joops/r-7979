// 경마일 알림용 요일→개최 경마장 매핑 (클라이언트/SW 공용 순수 데이터)
// 서울 토·일 / 부산경남 금·일 / 제주 금·토 — lib/kra/tracks.ts와 동일 기준.
// 설날·추석 주간의 대체 개최는 미반영(고정 요일 기준).

/** 요일(0=일 ~ 6=토) → 개최 경마장 이름 목록. 빈 배열 = 비경마일 */
export const RACE_DAY_TRACKS: Record<number, string[]> = {
  0: ["서울", "부산경남"],
  1: [],
  2: [],
  3: [],
  4: [],
  5: ["부산경남", "제주"],
  6: ["서울", "제주"],
};

export const RACE_DAY_TAGS: Record<number, string> = {
  0: "race_day_sun",
  5: "race_day_fri",
  6: "race_day_sat",
};

/** 현재 KST 요일 (0=일 ~ 6=토) — SW에서도 동작하도록 Intl 미사용 */
export function kstWeekday(now = Date.now()): number {
  return new Date(now + 9 * 3_600_000).getUTCDay();
}

/** 오늘(KST)이 경마일이면 개최 경마장 목록, 아니면 null */
export function todaysRacing(now = Date.now()): {
  tracks: string[];
  tag: string;
} | null {
  const weekday = kstWeekday(now);
  const tracks = RACE_DAY_TRACKS[weekday];
  if (!tracks || tracks.length === 0) return null;
  return { tracks, tag: RACE_DAY_TAGS[weekday] };
}
