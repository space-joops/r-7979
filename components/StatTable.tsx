/** 통산/최근 1년 성적 비교 표 — 말/기수 전적 페이지 공용 */

export interface StatRow {
  label: string;
  total: string;
  year: string;
}

export function StatTable({ caption, rows }: { caption: string; rows: StatRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] border-collapse text-sm">
        <caption className="mb-2 text-left font-semibold">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-foreground/20 text-left">
            <th scope="col" className="px-2 py-1.5">구분</th>
            <th scope="col" className="px-2 py-1.5 text-right">통산</th>
            <th scope="col" className="px-2 py-1.5 text-right">최근 1년</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-foreground/10">
              <th scope="row" className="px-2 py-1.5 text-left font-medium">
                {row.label}
              </th>
              <td className="px-2 py-1.5 text-right tabular-nums">{row.total}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{row.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function num(value?: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("ko-KR") : "-";
}

export function rate(value?: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${n}%` : "-";
}
