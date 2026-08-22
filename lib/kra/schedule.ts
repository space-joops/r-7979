// 경마 개최일 계산 — 순수 날짜 수학, API 호출 없음.
// 정기 요일 기준(서울 토·일 / 부산경남 금·일 / 제주 금·토).
// 설날·추석 주간의 대체 개최는 v1에서 미반영 — 해당 주는 페이지가
// "출마표 미발표" 플레이스홀더로 자연스럽게 처리된다.

import { addDays, todayKst, weekdayOf } from "@/lib/kst";
import { TRACKS, type Track } from "./tracks";

/** 해당 트랙이 해당 날짜에 정기 개최하는지 */
export function isRaceDay(track: Track, ymd: string): boolean {
  return track.raceDays.includes(weekdayOf(ymd));
}

/** from~to(포함) 범위에서 트랙의 개최일 목록 */
export function raceDates(track: Track, from: string, to: string): string[] {
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isRaceDay(track, d)) dates.push(d);
  }
  return dates;
}

/** 오늘 포함, 가장 가까운(오늘 또는 미래) 개최일 */
export function nearestRaceDay(track: Track, from = todayKst()): string {
  let d = from;
  while (!isRaceDay(track, d)) d = addDays(d, 1);
  return d;
}

/** 직전(과거) 개최일. from 자신은 제외 */
export function prevRaceDay(track: Track, from: string): string {
  let d = addDays(from, -1);
  while (!isRaceDay(track, d)) d = addDays(d, -1);
  return d;
}

/** 다음(미래) 개최일. from 자신은 제외 */
export function nextRaceDay(track: Track, from: string): string {
  let d = addDays(from, 1);
  while (!isRaceDay(track, d)) d = addDays(d, 1);
  return d;
}

/** 해당 날짜에 개최하는 트랙 목록 */
export function tracksRacingOn(ymd: string): Track[] {
  return TRACKS.filter((t) => isRaceDay(t, ymd));
}
