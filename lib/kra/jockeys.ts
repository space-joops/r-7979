// 트랙 전체 기수 성적 일괄 조회 — API11_1 (meet 파라미터, ServiceKey 대문자)
// 예측 모델의 기수 피처용: 경주당 N회 조회 대신 트랙당 1회 호출로 전원 확보.

import { kraFetch } from "./client";
import type { Track } from "./tracks";
import type { JockeyStat } from "./types";

/** 기수 성적은 주 단위 갱신 → 1일 캐시 */
const JOCKEY_TTL = 86_400;

/** 트랙 소속 전체 기수의 성적을 이름으로 조회 가능한 Map으로 반환 */
export async function getJockeyStatsByMeet(
  track: Track,
): Promise<Map<string, JockeyStat>> {
  const rows = await kraFetch<JockeyStat>({
    api: "API11_1/jockeyResult_1",
    authParam: "ServiceKey",
    params: { meet: track.meet },
    revalidate: JOCKEY_TTL,
    tags: ["kra", `jockeys-${track.slug}`],
  });
  return new Map(rows.map((row) => [row.jkName, row]));
}
