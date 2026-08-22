// 경주결과 조회 — API299 Race_Result_total (§5.2)
// 실관측: rcDate/rcNo는 순수 숫자, track 필드에 주로 상태("다습 (13%)"),
// wgHr은 "465(+7)" 문자열, winOdds/plcOdds는 응답에 없음(배당은 API301로 조인).

import { todayKst } from "@/lib/kst";
import { kraFetch } from "./client";
import type { Track } from "./tracks";
import type { RaceResultEntry } from "./types";

export interface ResultRaceGroup {
  raceNo: number;
  /** ISO 발주시각 (첫 행 기준) */
  startTime?: string;
  /** 주로 상태 (예: "다습 (13%)") */
  trackCondition?: string;
  rank?: string;
  entries: RaceResultEntry[];
}

/** 과거 날짜는 불변 → 30일, 오늘은 경주 진행에 따라 갱신 → 10분 */
function dataRevalidate(ymd: string): number {
  return ymd < todayKst() ? 2_592_000 : 600;
}

/** 해당 트랙·날짜의 경주결과를 경주 번호별로 그룹핑. 결과 없으면 빈 배열. */
export async function getResults(
  track: Track,
  ymd: string,
): Promise<ResultRaceGroup[]> {
  const rows = await kraFetch<RaceResultEntry>({
    api: "API299/Race_Result_total",
    params: { meet: track.meet, rc_date: ymd },
    revalidate: dataRevalidate(ymd),
    tags: ["kra", `results-${track.slug}-${ymd}`],
  });

  const groups = new Map<number, ResultRaceGroup>();
  for (const row of rows) {
    const raceNo = Number(row.rcNo);
    if (!Number.isFinite(raceNo) || raceNo < 1) continue;
    let group = groups.get(raceNo);
    if (!group) {
      group = {
        raceNo,
        startTime: row.schStTime,
        trackCondition: row.track,
        rank: row.rank,
        entries: [],
      };
      groups.set(raceNo, group);
    }
    group.entries.push(row);
  }

  for (const group of groups.values()) {
    // 착순 오름차순, 미완주(ord=0)는 맨 뒤로
    group.entries.sort((a, b) => {
      const ordA = Number(a.ord) || Infinity;
      const ordB = Number(b.ord) || Infinity;
      return ordA - ordB;
    });
  }
  return [...groups.values()].sort((a, b) => a.raceNo - b.raceNo);
}

/** "2026-08-16T10:35:00+09:00" → "10:35" */
export function formatStartTime(iso?: string): string | undefined {
  const match = iso?.match(/T(\d{2}:\d{2})/);
  return match?.[1];
}
