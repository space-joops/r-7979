// 경마 예상 모델 v1 — 가중 z-score + softmax
//
// 설계 원칙:
// 1. 의존성 제로(순수 TS) — Next.js 서버와 notes/의 Deno 노트북이 같은 파일을 import한다.
//    노트북에서 백테스트로 검증한 개선이 그대로 프로덕션 코드가 되는 구조.
// 2. 경주 "내" 상대 비교 — 경마는 절대 능력이 아니라 같은 경주 출전마끼리의
//    상대 우위 게임이므로, 모든 피처를 경주 내 z-score로 정규화한다.
// 3. 결측 관대 — 신마(2세 데뷔전)는 레이팅이 없다. 결측은 z=0(경주 평균)으로 두어
//    "모르면 중립" 원칙을 지킨다.
//
// 개선 이력은 notes/ 폴더의 노트북 참조. 새 버전은 model-v2.ts로 나란히 두고
// UI의 MODEL 상수만 바꾼다(버전 비교 가능하게 파일을 덮어쓰지 않는다).

export const MODEL_VERSION = "v1";
export const MODEL_LABEL = "모델 v1 — 가중 z-score";

/** 예측에 쓰는 마별 입력. null = 결측(중립 처리) */
export interface HorseInput {
  gate: number;
  name: string;
  /** KRA 레이팅 (신마는 null) */
  rating: number | null;
  /** 부담중량 kg */
  burdWgt: number | null;
  /** 전주 대비 마체중 증감 kg */
  wgtIndec: number | null;
  /** 기수 최근 1년 승률 % */
  jkWinRateY: number | null;
  /** 기수 최근 1년 연대율(1~2착) % */
  jkQnlRateY: number | null;
}

export interface Contribution {
  feature: string;
  labelKo: string;
  /** 원본 값 (결측이면 null) */
  raw: number | null;
  /** 경주 내 z-score (결측=0) */
  z: number;
  weight: number;
  /** z × weight — 점수 기여분 */
  value: number;
}

export interface ScoredHorse extends HorseInput {
  score: number;
  /** softmax 승리 확률 (0~1) */
  prob: number;
  rank: number;
  contributions: Contribution[];
}

// 가중치 — 절대값 합 = 1.0 이 되게 유지하면 기여도 해석이 쉽다.
// 부호: (+) 클수록 유리, (−) 클수록 불리.
// 값의 근거와 튜닝 실험은 notes/01-model-v1.ipynb 참조.
export const WEIGHTS = {
  rating: 0.4, // 능력 지표 — 가장 강한 단일 신호
  jkWinRateY: 0.2, // 기수 최근 1년 승률
  jkQnlRateY: 0.1, // 기수 최근 1년 연대율 (승률과 보완)
  burdWgt: -0.15, // 부담중량 — 무거울수록 불리
  wgtAbsChange: -0.1, // 급격한 체중 변화(증/감 모두) — 컨디션 우려
  gate: -0.05, // 바깥 게이트 소폭 불리
} as const;

/** softmax 온도 — 낮을수록 확률이 상위권에 쏠린다. 백테스트로 튜닝. */
export const SOFTMAX_SCALE = 2.5;

const FEATURE_LABELS: Record<string, string> = {
  rating: "레이팅",
  jkWinRateY: "기수 승률(1년)",
  jkQnlRateY: "기수 연대율(1년)",
  burdWgt: "부담중량",
  wgtAbsChange: "체중 변화폭",
  gate: "게이트",
};

/** 결측을 무시하고 평균/표준편차 계산 → z-score 배열 (결측·분산0은 z=0) */
function zScores(values: (number | null)[]): number[] {
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return values.map(() => 0);
  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  const variance =
    present.reduce((a, b) => a + (b - mean) ** 2, 0) / present.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 0);
  return values.map((v) => (v == null ? 0 : (v - mean) / std));
}

export interface ScoreOptions {
  /** 가중치 오버라이드 — 노트북(notes/)에서 튜닝 실험용. 미지정 시 WEIGHTS */
  weights?: Partial<typeof WEIGHTS>;
  /** softmax 온도 오버라이드. 미지정 시 SOFTMAX_SCALE */
  scale?: number;
}

/**
 * 한 경주의 출전마들을 채점해 승리 확률 순으로 반환.
 * 입력 순서와 무관하게 rank/prob이 계산된다.
 * opts로 가중치/온도를 바꿔 실험할 수 있다(프로덕션은 기본값 사용).
 */
export function scoreRace(
  horses: HorseInput[],
  opts: ScoreOptions = {},
): ScoredHorse[] {
  if (horses.length === 0) return [];
  const weights = { ...WEIGHTS, ...opts.weights };
  const scale = opts.scale ?? SOFTMAX_SCALE;

  // 피처 행렬 구성 — wgtIndec은 "변화폭"(절대값)으로 변환해 사용
  const featureValues: Record<string, (number | null)[]> = {
    rating: horses.map((h) => h.rating),
    jkWinRateY: horses.map((h) => h.jkWinRateY),
    jkQnlRateY: horses.map((h) => h.jkQnlRateY),
    burdWgt: horses.map((h) => h.burdWgt),
    wgtAbsChange: horses.map((h) =>
      h.wgtIndec == null ? null : Math.abs(h.wgtIndec),
    ),
    gate: horses.map((h) => h.gate),
  };

  const featureZ = Object.fromEntries(
    Object.entries(featureValues).map(([k, v]) => [k, zScores(v)]),
  );

  const scored = horses.map((horse, i) => {
    const contributions: Contribution[] = Object.entries(weights).map(
      ([feature, weight]) => ({
        feature,
        labelKo: FEATURE_LABELS[feature],
        raw: featureValues[feature][i],
        z: featureZ[feature][i],
        weight,
        value: featureZ[feature][i] * weight,
      }),
    );
    const score = contributions.reduce((a, c) => a + c.value, 0);
    return { ...horse, score, prob: 0, rank: 0, contributions };
  });

  // softmax → 승리 확률. 경주당 확률 합 = 100%.
  const maxScore = Math.max(...scored.map((s) => s.score));
  const exps = scored.map((s) => Math.exp((s.score - maxScore) * scale));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  scored.forEach((s, i) => {
    s.prob = exps[i] / sumExp;
  });

  scored.sort((a, b) => b.prob - a.prob);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });
  return scored;
}
