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
