// 말/기수 전적 조회 — API15_2(말), API145(말 1년 요약), API11_1(기수)
// 주의: API15_2와 API11_1은 레거시 API라 인증 파라미터가 `ServiceKey`(대문자).
// 이름 조회는 부분 매칭으로 동작(실관측: "안드레" → "안드레아"까지 반환) —
// 정확 일치를 우선하고 나머지는 "비슷한 이름" 후보로 제공한다.

import { kraFetch } from "./client";
import type { HorseStat, HorseYearSummary, JockeyStat } from "./types";

/** 전적 데이터는 주 단위로 변함 → 1일 캐시 */
const PROFILE_TTL = 86_400;

export interface HorseProfile {
  /** 이름이 정확히 일치하는 말들 (동명이마 가능) */
  exact: HorseStat[];
  /** 부분 매칭된 다른 이름들 (중복 제거) */
  similarNames: string[];
  /** exact 첫 마리의 1년 요약 (있으면) */
  yearSummary?: HorseYearSummary;
}

export async function getHorseProfile(name: string): Promise<HorseProfile> {
  const [stats, summaries] = await Promise.all([
    kraFetch<HorseStat>({
      api: "API15_2/raceHorseResult_2",
      authParam: "ServiceKey",
      params: { hr_name: name },
      revalidate: PROFILE_TTL,
      tags: ["kra", `horse-${name}`],
    }),
    kraFetch<HorseYearSummary>({
      api: "API145/rchrLoyRcod",
      params: { hr_name: name },
      revalidate: PROFILE_TTL,
      tags: ["kra", `horse-${name}`],
    }),
  ]);

  const exact = stats.filter((s) => s.hrName === name);
  const similarNames = [
    ...new Set(stats.filter((s) => s.hrName !== name).map((s) => s.hrName)),
  ];
  const yearSummary = summaries.find((s) => s.hrnm === name);
  return { exact, similarNames, yearSummary };
}

export interface JockeyProfile {
  exact: JockeyStat[];
  similarNames: string[];
}

export async function getJockeyProfile(name: string): Promise<JockeyProfile> {
  const stats = await kraFetch<JockeyStat>({
    api: "API11_1/jockeyResult_1",
    authParam: "ServiceKey",
    params: { jk_name: name },
    revalidate: PROFILE_TTL,
    tags: ["kra", `jockey-${name}`],
  });

  const exact = stats.filter((s) => s.jkName === name);
  const similarNames = [
    ...new Set(stats.filter((s) => s.jkName !== name).map((s) => s.jkName)),
  ];
  return { exact, similarNames };
}

/** 라우트 파라미터 이름 검증 — 한글/영문/숫자/공백, 1~25자 */
export function isValidProfileName(name: string): boolean {
  return /^[\p{L}\p{N} ]{1,25}$/u.test(name);
}

/** 20260613 → "2026.06.13" */
export function formatYmdNum(ymd?: string | number): string {
  const s = String(ymd ?? "");
  if (!/^\d{8}$/.test(s)) return "-";
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

/** 34650000 → "3,465만원" */
export function formatPrize(amount?: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
}
