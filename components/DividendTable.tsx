import { formatOdds, POOL_LABELS, type RaceDividends } from "@/lib/kra/dividends";
import type { DividendPool, DividendRate } from "@/lib/kra/types";

function combo(row: DividendRate): string {
  return [row.chulNo, row.chulNo2, row.chulNo3]
    .map(Number)
    .filter((n) => n > 0)
    .join("-");
}

/** 확정 배당률 테이블 — 승식별로 상위 조합을 표시 */
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <caption className="mb-2 text-left font-semibold">
          {trackName} 제{race.raceNo}경주 확정 배당률
        </caption>
        <thead>
          <tr className="border-b-2 border-foreground/20 text-left">
            <th scope="col" className="px-2 py-1.5">승식</th>
            <th scope="col" className="px-2 py-1.5">조합(마번)</th>
            <th scope="col" className="px-2 py-1.5 text-right">배당률</th>
          </tr>
        </thead>
        <tbody>
          {present.flatMap((pool) =>
            (race.byPool[pool] ?? []).map((row, i) => (
              <tr
                key={`${pool}-${i}`}
                className="border-b border-foreground/10 hover:bg-foreground/5"
              >
                <td className="px-2 py-1.5">{i === 0 ? POOL_LABELS[pool] : ""}</td>
                <td className="px-2 py-1.5 font-medium">{combo(row)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatOdds(row.odds)}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
