// 출전표 조회 — API78 chulmainfo (§5.9)

import { todayKst } from "@/lib/kst";
import { kraFetch } from "./client";
import type { Track } from "./tracks";
import type { RacecardEntry } from "./types";

export interface RaceGroup {
  raceNo: number;
  raceName: string;
  /** 발주 예정 시각 "HH:MM" (없을 수 있음) */
  startTime?: string;
  /** 경주조건 텍스트 */
  conditions: string[];
  entries: RacecardEntry[];
}

/** 과거 날짜 데이터는 불변 → 30일, 오늘/미래는 30분 캐시 */
function dataRevalidate(ymd: string): number {
  return ymd < todayKst() ? 2_592_000 : 1_800;
}

/** API78의 raceNo는 "제1경주" 형태의 문자열로 온다(실관측) — 숫자만 추출 */
function parseRaceNo(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

/** 해당 트랙·날짜의 출전표를 경주 번호별로 그룹핑해 반환. 미발표면 빈 배열. */
export async function getRacecard(track: Track, ymd: string): Promise<RaceGroup[]> {
  const rows = await kraFetch<RacecardEntry>({
    api: "API78/chulmainfo",
    params: { rccrs_cd: track.meet, race_dt: ymd },
    revalidate: dataRevalidate(ymd),
    tags: ["kra", `racecard-${track.slug}-${ymd}`],
  });

  const groups = new Map<number, RaceGroup>();
  for (const row of rows) {
    const raceNo = parseRaceNo(row.raceNo);
    if (!Number.isFinite(raceNo) || raceNo < 1) continue;
    let group = groups.get(raceNo);
    if (!group) {
      group = {
        raceNo,
        raceName: row.raceNm ?? `제${raceNo}경주`,
        startTime: row.strtTim || undefined,
        conditions: [row.raceCnd1, row.raceCnd2, row.raceCnd3].filter(
          (c): c is string => Boolean(c),
        ),
        entries: [],
      };
      groups.set(raceNo, group);
    }
    group.entries.push(row);
  }

  for (const group of groups.values()) {
    group.entries.sort((a, b) => Number(a.gtno) - Number(b.gtno));
  }
  return [...groups.values()].sort((a, b) => a.raceNo - b.raceNo);
}
