// KRA Open API 응답 타입 — docs/kra-openapi-reference.md 기준(실관측 필드).
// 수치 필드도 문자열로 올 수 있어 string | number 로 관대하게 받는다.

/** 정상 응답 envelope (§4) */
export interface KraEnvelope<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      /** 0건이면 "" 로 오는 경우가 있음. 1건이면 item이 dict, 2건 이상이면 list */
      items: { item: T | T[] } | "" | null;
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

/** 게이트웨이 오류 envelope — 인증/승인/트래픽 문제 시 HTTP 200으로도 옴 (§4) */
export interface KraGatewayErrorBody {
  OpenAPI_ServiceResponse: {
    cmmMsgHeader: {
      errMsg: string;
      returnAuthMsg: string;
      returnReasonCode: string;
    };
  };
}

/** API78 chulmainfo — 출전표 한 행(말 한 마리) (§5.9) */
export interface RacecardEntry {
  raceDt: string | number;
  raceNo: string | number;
  raceNm: string;
  raceDyCnt?: string | number;
  gtno: string | number;
  hrnm: string;
  hrsAg?: string | number;
  gndrNm?: string;
  prdsNm?: string;
  burdWgt?: string | number;
  wgtIndec?: string | number;
  rating?: string | number;
  jckyNm?: string;
  trarNm?: string;
  ownerNm?: string;
  equipCrs?: string;
  ptinCycl?: string | number;
  trngTcnt?: string | number;
  spn?: string;
  strtTim?: string;
  raceCnd1?: string;
  raceCnd2?: string;
  raceCnd3?: string;
}

/** API299 Race_Result_total — 경주결과 한 행(말 한 마리) (§5.2, 실관측 필드) */
export interface RaceResultEntry {
  /** 숫자 YYYYMMDD (API78과 달리 순수 숫자) */
  rcDate: string | number;
  rcNo: string | number;
  /** 착순. 0이면 미완주/제외 */
  ord: string | number;
  chulNo: string | number;
  hrNo?: string;
  hrName: string;
  age?: string | number;
  sex?: string;
  prdName?: string;
  rank?: string;
  /** 완주기록(초), 예: 74.7 */
  rcTime?: string | number;
  /** 마체중 "465(+7)" 형태 문자열 */
  wgHr?: string;
  wgBudam?: string | number;
  jkName?: string;
  trName?: string;
  /** ISO 형식 "2026-08-16T10:35:00+09:00" */
  schStTime?: string;
  /** 주로 상태 "다습 (13%)" */
  track?: string;
  /** 0이 아니면 경주 취소 등 */
  noraceFlag?: string | number;
}

/** API15_2 raceHorseResult_2 — 경주마 성적 (§5.14, 실관측. ServiceKey 대문자) */
export interface HorseStat {
  hrNo: string;
  hrName: string;
  meet?: string;
  age?: string | number;
  sex?: string;
  /** YYYYMMDD 숫자 */
  debut?: string | number;
  /** 산지 */
  name?: string;
  rcCntT?: string | number;
  rcCntY?: string | number;
  ord1CntT?: string | number;
  ord1CntY?: string | number;
  ord2CntT?: string | number;
  ord2CntY?: string | number;
  winRateT?: string | number;
  winRateY?: string | number;
  qnlRateT?: string | number;
  qnlRateY?: string | number;
  chaksunT?: string | number;
  chaksunY?: string | number;
  recentRcDate?: string | number;
  recentRcNo?: string | number;
  recentRcName?: string;
  recentRcDist?: string | number;
  recentRcTime?: string | number;
  recentOrd?: string | number;
  recentRank?: string;
  recentRating?: string | number;
  recentBudam?: string;
  recentWgHr?: string | number;
  recentWgBudam?: string | number;
}

/** API145 rchrLoyRcod — 경주마 최근 1년 요약 (§5.3, 실관측) */
export interface HorseYearSummary {
  hrnm: string;
  hrno: string;
  rccrsNm?: string;
  /** 1년 출주 수 */
  loyPtinTcnt?: string | number;
  loyFcmTcnt?: string | number;
  loyScmTcnt?: string | number;
  loyTcmTcnt?: string | number;
  loyFocmTcnt?: string | number;
  loyFvcmTcnt?: string | number;
  /** 1년 순위상금 합계 */
  loyPlcpmAmt?: string | number;
  /** 최종 출주일 "2026.08.16" */
  lstPtinDt?: string;
}

/** API11_1 jockeyResult_1 — 기수 성적 (§5.13, 실관측. ServiceKey 대문자) */
export interface JockeyStat {
  jkNo: string;
  jkName: string;
  meet?: string;
  rcCntT?: string | number;
  rcCntY?: string | number;
  ord1CntT?: string | number;
  ord1CntY?: string | number;
  ord2CntT?: string | number;
  ord2CntY?: string | number;
  winRateT?: string | number;
  winRateY?: string | number;
  qnlRateT?: string | number;
  qnlRateY?: string | number;
}

export type DividendPool =
  | "WIN"
  | "PLC"
  | "QNL"
  | "EXA"
  | "QPL"
  | "TLA"
  | "TRI";

/** API301 Dividend_rate_total — 확정 배당률 한 행 (§5.12) */
export interface DividendRate {
  rcDate: string | number;
  rcNo: string | number;
  /** 응답에서는 한글 트랙명("서울" 등) */
  meet: string;
  pool: DividendPool;
  chulNo: string | number;
  /** 해당 승식에 쓰이지 않는 열은 0 */
  chulNo2: string | number;
  chulNo3: string | number;
  /** 9999.9 = 무효/미발매 마커 — 배당 0으로 오인 금지 */
  odds: string | number;
}
