// 확정 배당률 조회 — API301 Dividend_rate_total (§5.12)
// 경주 후 확정된 배당률이다(실시간 아님) — UI에서 "확정 배당률"로 명확히 라벨링할 것.

import { todayKst } from "@/lib/kst";
import { kraFetch } from "./client";
import type { Track } from "./tracks";
import type { DividendPool, DividendRate } from "./types";

/** 무효/미발매 마커 (§5.12) — 배당 0이 아니라 발매 자체가 없었다는 뜻 */
export const VOID_ODDS = 9999.9;

export const POOL_LABELS: Record<DividendPool, string> = {
  WIN: "단승",
  PLC: "연승",
  QNL: "복승",
  EXA: "쌍승",
  QPL: "복연승",
  TLA: "삼복승",
  TRI: "삼쌍승",
};

export interface RaceDividends {
  raceNo: number;
  byPool: Partial<Record<DividendPool, DividendRate[]>>;
}

/** 과거 날짜는 불변 → 30일, 오늘은 경주 진행에 따라 갱신 → 300초 */
function dataRevalidate(ymd: string): number {
  return ymd < todayKst() ? 2_592_000 : 300;
}

/**
 * 해당 트랙·날짜의 확정 배당률을 경주 번호별로 그룹핑.
 * pool마다 별도 API 호출이 필요해 기본은 단승·연승·복승·쌍승 4종만 조회.
 */
export async function getDividends(
  track: Track,
  ymd: string,
  pools: DividendPool[] = ["WIN", "PLC", "QNL", "EXA"],
): Promise<RaceDividends[]> {
  const perPool = await Promise.all(
    pools.map((pool) =>
      kraFetch<DividendRate>({
        api: "API301/Dividend_rate_total",
        params: { meet: track.meet, rc_date: ymd, pool },
        revalidate: dataRevalidate(ymd),
        tags: ["kra", `odds-${track.slug}-${ymd}`],
      }).then((rows) => ({ pool, rows })),
    ),
  );

  const races = new Map<number, RaceDividends>();
  for (const { pool, rows } of perPool) {
    for (const row of rows) {
      const raceNo = Number(row.rcNo);
      if (!Number.isFinite(raceNo) || raceNo < 1) continue;
      let race = races.get(raceNo);
      if (!race) {
        race = { raceNo, byPool: {} };
        races.set(raceNo, race);
      }
      (race.byPool[pool] ??= []).push(row);
    }
  }

  for (const race of races.values()) {
    for (const rows of Object.values(race.byPool)) {
      rows.sort((a, b) => Number(a.odds) - Number(b.odds));
    }
  }
  return [...races.values()].sort((a, b) => a.raceNo - b.raceNo);
}

/** 배당률 표시 문자열. 무효/미발매는 "발매 없음" */
export function formatOdds(odds: string | number): string {
  const n = Number(odds);
  if (!Number.isFinite(n) || n >= VOID_ODDS) return "발매 없음";
  return n.toFixed(1);
}
