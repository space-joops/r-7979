// 경마장(트랙) 정적 정보. meet 코드는 KRA API의 meet/rccrs_cd 파라미터 값.
// 응답의 meet 필드는 숫자가 아니라 한국어 이름 문자열("서울" 등)로 온다 — docs/kra-openapi-reference.md 참고.

export type TrackSlug = "seoul" | "busan" | "jeju";

export interface Track {
  slug: TrackSlug;
  meet: 1 | 2 | 3;
  nameKo: string;
  /** API 응답의 meet 필드 값과 매칭되는 이름 */
  apiName: string;
  parkName: string;
  address: string;
  /** 정기 개최 요일 (0=일 ~ 6=토) */
  raceDays: number[];
}

export const TRACKS: Track[] = [
  {
    slug: "seoul",
    meet: 1,
    nameKo: "서울",
    apiName: "서울",
    parkName: "렛츠런파크 서울",
    address: "경기도 과천시 경마공원대로 107",
    raceDays: [6, 0], // 토·일
  },
  {
    slug: "busan",
    meet: 3,
    nameKo: "부산경남",
    apiName: "부산경남",
    parkName: "렛츠런파크 부산경남",
    address: "부산광역시 강서구 가락대로 929",
    raceDays: [5, 0], // 금·일
  },
  {
    slug: "jeju",
    meet: 2,
    nameKo: "제주",
    apiName: "제주",
    parkName: "렛츠런파크 제주",
    address: "제주특별자치도 제주시 애월읍 평화로 2144",
    raceDays: [5, 6], // 금·토
  },
];

export function trackBySlug(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

export function trackByMeet(meet: number): Track | undefined {
  return TRACKS.find((t) => t.meet === meet);
}

/** 응답의 한글 트랙명("서울" 등)으로 조회 */
export function trackByApiName(name: string): Track | undefined {
  return TRACKS.find((t) => t.apiName === name);
}
