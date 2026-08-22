// 출마표(API78) 행 + 기수 성적 → 모델 입력(HorseInput) 변환.
// KRA 응답의 지저분한 값("()", " ", 문자열 숫자)을 여기서 전부 정리한다.
// 모델 본체(model-v1.ts)는 깨끗한 숫자만 다루도록 관심사를 분리.

import type { RacecardEntry, JockeyStat } from "@/lib/kra/types";
import type { HorseInput } from "./model-v1";

/** "52.5" | 52.5 → number, 비수치·빈값 → null */
function toNum(value: string | number | undefined | null): number | null {
  if (value == null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

/** 레이팅 "()" · "" → null, "R29" 같은 형태도 숫자만 추출 */
function parseRating(raw: string | number | undefined): number | null {
  const s = String(raw ?? "").trim();
  if (!s || s === "()") return null;
  const match = s.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function toHorseInput(
  entry: RacecardEntry,
  jockeys: Map<string, JockeyStat>,
): HorseInput {
  const jockey = entry.jckyNm ? jockeys.get(entry.jckyNm.trim()) : undefined;
  return {
    gate: Number(entry.gtno) || 0,
    name: entry.hrnm,
    rating: parseRating(entry.rating),
    burdWgt: toNum(entry.burdWgt),
    wgtIndec: toNum(entry.wgtIndec),
    jkWinRateY: toNum(jockey?.winRateY),
    jkQnlRateY: toNum(jockey?.qnlRateY),
  };
}
