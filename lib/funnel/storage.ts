// 퍼널 상태 localStorage 래퍼 — SSR-safe, try/catch, krfunnel: 프리픽스, 스키마 버전 관리

const PREFIX = "krfunnel:";
const SCHEMA_VERSION = "1";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // 사생활 보호 모드 등 — 무시
  }
}

/** 스키마 버전 확인, 불일치 시 프리픽스 전체 초기화. 클라이언트 마운트 시 1회 호출 */
export function ensureSchema(): void {
  if (safeGet("v") === SCHEMA_VERSION) return;
  try {
    const stale = Object.keys(window.localStorage).filter((k) =>
      k.startsWith(PREFIX),
    );
    for (const k of stale) window.localStorage.removeItem(k);
  } catch {
    // 무시
  }
  safeSet("v", SCHEMA_VERSION);
}

export const funnelStorage = {
  get: safeGet,
  set: safeSet,

  getNumber(key: string): number {
    return Number(safeGet(key)) || 0;
  },

  increment(key: string): number {
    const next = this.getNumber(key) + 1;
    safeSet(key, String(next));
    return next;
  },

  getJson<T>(key: string): T | null {
    const raw = safeGet(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJson(key: string, value: unknown): void {
    safeSet(key, JSON.stringify(value));
  },

  /** 저장된 ISO 시각으로부터 days일이 지났는지 (값 없으면 true) */
  olderThanDays(key: string, days: number): boolean {
    const raw = safeGet(key);
    if (!raw) return true;
    const ts = Date.parse(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts > days * 86_400_000;
  },

  touch(key: string): void {
    safeSet(key, new Date().toISOString());
  },
};

export const sessionFlags = {
  get(key: string): boolean {
    try {
      return window.sessionStorage.getItem(PREFIX + key) === "1";
    } catch {
      return false;
    }
  },
  set(key: string): void {
    try {
      window.sessionStorage.setItem(PREFIX + key, "1");
    } catch {
      // 무시
    }
  },
};
