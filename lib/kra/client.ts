// KRA Open API 공통 클라이언트.
// docs/kra-openapi-reference.md §7 체크리스트의 모든 항목을 여기서 처리한다:
// envelope 정규화(dict/list/""), NODATA, 게이트웨이 오류, XML 폴백 감지,
// 페이지네이션, 서비스키 인코딩/은닉, per-API 인증 파라미터명.

import type { KraEnvelope, KraGatewayErrorBody } from "./types";

const BASE_URL = "https://apis.data.go.kr/B551015";
const PAGE_SIZE = 300;

export class KraError extends Error {}
/** 게이트웨이 인증/승인/트래픽 오류 (HTTP 200으로도 옴) */
export class KraGatewayError extends KraError {
  constructor(
    public authMsg: string,
    public reasonCode: string,
  ) {
    super(`KRA gateway error: ${authMsg} (code ${reasonCode})`);
  }
}
/** _type=json 요청에 XML이 온 경우 — 자료실(textDataHold*) 계열. Phase 4에서 파서 추가 예정 */
export class KraXmlResponseError extends KraError {
  constructor(api: string) {
    super(`KRA returned XML for ${api} (textDataHold* fallback not implemented)`);
  }
}

export interface KraCall {
  /** 예: "API78/chulmainfo" */
  api: string;
  /** 레거시 API(racePlan_2, jockeyResult_1, raceHorseResult_2)만 "ServiceKey" */
  authParam?: "serviceKey" | "ServiceKey";
  params: Record<string, string | number>;
  /** Next data cache TTL(초) — KRA 레이트리밋 방어막 겸용 */
  revalidate: number;
  tags: string[];
}

/** 전체 페이지를 수집해 정규화된 배열로 반환. NODATA는 빈 배열. */
export async function kraFetch<T>(call: KraCall): Promise<T[]> {
  const key = process.env.KRA_SERVICE_KEY;
  if (!key) throw new KraError("KRA_SERVICE_KEY is not set");

  const all: T[] = [];
  let pageNo = 1;
  for (;;) {
    const search = new URLSearchParams({
      // Decoding(원본) 키 사용 규칙: URLSearchParams가 1회만 인코딩한다
      [call.authParam ?? "serviceKey"]: key,
      _type: "json",
      pageNo: String(pageNo),
      numOfRows: String(PAGE_SIZE),
    });
    for (const [k, v] of Object.entries(call.params)) search.set(k, String(v));

    const url = `${BASE_URL}/${call.api}?${search}`;
    const res = await fetch(url, {
      next: { revalidate: call.revalidate, tags: call.tags },
    });
    // 주의: 오류 메시지에 url(쿼리스트링=서비스키)을 절대 포함하지 않는다
    if (!res.ok) {
      throw new KraError(`KRA HTTP ${res.status} for ${call.api}`);
    }

    const text = await res.text();
    if (text.trimStart().startsWith("<")) throw new KraXmlResponseError(call.api);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new KraError(`KRA non-JSON response for ${call.api}`);
    }

    if (isGatewayError(parsed)) {
      const h = parsed.OpenAPI_ServiceResponse.cmmMsgHeader;
      throw new KraGatewayError(h.returnAuthMsg, h.returnReasonCode);
    }

    const { header, body } = (parsed as KraEnvelope<T>).response ?? {};
    if (!header) throw new KraError(`KRA unexpected envelope for ${call.api}`);
    if (header.resultCode === "03" || header.resultCode === "NODATA_ERROR") {
      return all; // 데이터 없음 — 오류 아님
    }
    if (header.resultCode !== "00") {
      throw new KraError(
        `KRA ${call.api} result ${header.resultCode}: ${header.resultMsg}`,
      );
    }

    all.push(...normalizeItems(body.items));

    const total = Number(body.totalCount) || 0;
    if (pageNo * PAGE_SIZE >= total) return all;
    pageNo += 1;
  }
}

/** items가 "" | null | {item: dict | list} 어느 형태로 와도 배열로 정규화 */
function normalizeItems<T>(items: KraEnvelope<T>["response"]["body"]["items"]): T[] {
  if (!items || typeof items === "string") return [];
  const item = items.item;
  if (item == null) return [];
  return Array.isArray(item) ? item : [item];
}

function isGatewayError(parsed: unknown): parsed is KraGatewayErrorBody {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "OpenAPI_ServiceResponse" in parsed
  );
}
