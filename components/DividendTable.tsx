import { formatOdds, POOL_LABELS, type RaceDividends } from "@/lib/kra/dividends";
import type { DividendPool, DividendRate } from "@/lib/kra/types";

/** 접지 않고 바로 보여줄 조합 수 — 복승/쌍승은 조합이 수십~수백 개라 상위만 우선 */
const VISIBLE_ROWS = 10;

function combo(row: DividendRate): string {
  return [row.chulNo, row.chulNo2, row.chulNo3]
    .map(Number)
    .filter((n) => n > 0)
    .join("-");
}

function PoolRows({ rows }: { rows: DividendRate[] }) {
  return (
    <>
      {rows.map((row, i) => (
        <tr key={i} className="border-b border-foreground/10 hover:bg-foreground/5">
          <td className="px-2 py-1.5 font-medium tabular-nums">{combo(row)}</td>
          <td className="px-2 py-1.5 text-right tabular-nums">
            {formatOdds(row.odds)}
          </td>
        </tr>
      ))}
    </>
  );
}

function PoolTable({
  pool,
  rows,
  trackName,
  raceNo,
}: {
  pool: DividendPool;
  rows: DividendRate[];
  trackName: string;
  raceNo: number;
}) {
  const visible = rows.slice(0, VISIBLE_ROWS);
  const rest = rows.slice(VISIBLE_ROWS);

  const table = (shown: DividendRate[], caption: boolean) => (
    <table className="w-full min-w-[280px] border-collapse text-sm">
      {caption && (
        <caption className="mb-2 text-left font-semibold">
          {POOL_LABELS[pool]}
          <span className="ml-2 text-xs font-normal text-foreground/50">
            {trackName} 제{raceNo}경주 · {rows.length}개 조합
          </span>
        </caption>
      )}
      <thead className={caption ? "" : "sr-only"}>
        <tr className="border-b-2 border-foreground/20 text-left">
          <th scope="col" className="px-2 py-1.5">조합(마번)</th>
          <th scope="col" className="px-2 py-1.5 text-right">배당률</th>
        </tr>
      </thead>
      <tbody>
        <PoolRows rows={shown} />
      </tbody>
    </table>
  );

  return (
    <div>
      {table(visible, true)}
      {rest.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer px-2 py-1.5 text-sm text-accent hover:underline">
            나머지 {rest.length}개 조합 보기
          </summary>
          {table(rest, false)}
        </details>
      )}
    </div>
  );
}

/** 확정 배당률 — 승식별 섹션. 낮은 배당(인기) 순 정렬, 긴 승식은 상위 10개+접기 */
export function DividendTable({
  race,
  trackName,
  pools = ["WIN", "PLC", "QNL", "EXA"],
}: {
  race: RaceDividends;
  trackName: string;
  pools?: DividendPool[];
}) {
  const present = pools.filter((p) => race.byPool[p]?.length);
  if (present.length === 0) return null;
  return (
    <div className="space-y-6 overflow-x-auto">
      <h3 className="font-semibold">
        {trackName} 제{race.raceNo}경주 확정 배당률
      </h3>
      <div className="grid gap-6 sm:grid-cols-2">
        {present.map((pool) => (
          <PoolTable
            key={pool}
            pool={pool}
            rows={race.byPool[pool] ?? []}
            trackName={trackName}
            raceNo={race.raceNo}
          />
        ))}
      </div>
    </div>
  );
}
