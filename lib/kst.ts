// KST(Asia/Seoul) 날짜 유틸.
// Vercel 서버는 UTC로 동작하므로 "오늘"은 반드시 타임존을 명시해 계산한다.

const KST_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 현재 KST 기준 오늘 날짜를 "YYYYMMDD"로 반환 */
export function todayKst(): string {
  return KST_FMT.format(new Date()).replaceAll("-", "");
}

/** "YYYYMMDD" → Date(UTC 자정). 형식이 틀리면 null */
export function parseYmd(ymd: string): Date | null {
  if (!/^\d{8}$/.test(ymd)) return null;
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const date = new Date(Date.UTC(y, m - 1, d));
  // 2월 30일 같은 비실존 날짜는 Date가 자동 이월시키므로 역검증
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** 라우트 파라미터용 엄격 검증: 실존 날짜 + 2020-01-01 ~ 오늘+14일 범위 */
export function isValidYmd(ymd: string): boolean {
  const date = parseYmd(ymd);
  if (!date) return false;
  if (ymd < "20200101") return false;
  return ymd <= addDays(todayKst(), 14);
}

/** "YYYYMMDD"에 일수를 더한 "YYYYMMDD" 반환 (음수 가능) */
export function addDays(ymd: string, days: number): string {
  const date = parseYmd(ymd);
  if (!date) throw new Error(`invalid ymd: ${ymd}`);
  date.setUTCDate(date.getUTCDate() + days);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

/** "YYYYMMDD"의 요일 (0=일 ~ 6=토) */
export function weekdayOf(ymd: string): number {
  const date = parseYmd(ymd);
  if (!date) throw new Error(`invalid ymd: ${ymd}`);
  return date.getUTCDay();
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "20260823" → "8월 23일 (일)" */
export function formatKo(ymd: string): string {
  const date = parseYmd(ymd);
  if (!date) throw new Error(`invalid ymd: ${ymd}`);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${WEEKDAY_KO[date.getUTCDay()]})`;
}

/** "20260823" → "2026년 8월 23일 (일)" */
export function formatKoFull(ymd: string): string {
  const date = parseYmd(ymd);
  if (!date) throw new Error(`invalid ymd: ${ymd}`);
  return `${date.getUTCFullYear()}년 ${formatKo(ymd)}`;
}

/** "20260823" → "2026-08-23" (datetime 속성/JSON-LD용) */
export function toIsoDate(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}
