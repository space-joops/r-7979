import Link from "next/link";
import { formatOdds } from "@/lib/kra/dividends";
import { formatStartTime, type ResultRaceGroup } from "@/lib/kra/results";
import type { DividendRate } from "@/lib/kra/types";

function clean(value: string | number | undefined): string {
  const s = String(value ?? "").trim();
  if (!s || s === "0") return "-";
  return s;
}

/** 유효한 이름이면 전적 페이지 링크, 아니면 "-" */
function NameLink({
  value,
  base,
}: {
  value: string | number | undefined;
  base: "horses" | "jockeys";
}) {
  const name = clean(value);
  if (name === "-") return <>-</>;
  return (
    <Link
      href={`/${base}/${encodeURIComponent(name)}`}
      className="hover:text-accent hover:underline"
    >
      {name}
    </Link>
  );
}

/** 경주결과 테이블 — 착순·기록·단승/연승 배당(WIN/PLC 조인) */
export function ResultsTable({
  race,
  trackName,
  winRows = [],
  plcRows = [],
}: {
  race: ResultRaceGroup;
  trackName: string;
  /** 해당 경주의 WIN 배당 행 (chulNo 매칭) */
  winRows?: DividendRate[];
  /** 해당 경주의 PLC 배당 행 (chulNo 매칭) */
  plcRows?: DividendRate[];
}) {
  const winByChul = new Map(winRows.map((r) => [Number(r.chulNo), r.odds]));
  const plcByChul = new Map(plcRows.map((r) => [Number(r.chulNo), r.odds]));
  const startTime = formatStartTime(race.startTime);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="mb-2 text-left font-semibold">
          {trackName} 제{race.raceNo}경주 결과
          <span className="ml-2 font-normal text-foreground/60">
            {[race.rank, startTime && `발주 ${startTime}`, race.trackCondition && `주로 ${race.trackCondition}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </caption>
        <thead>
          <tr className="border-b-2 border-foreground/20 text-left">
            <th scope="col" className="px-2 py-1.5">착순</th>
            <th scope="col" className="px-2 py-1.5">마번</th>
            <th scope="col" className="px-2 py-1.5">마명</th>
            <th scope="col" className="px-2 py-1.5 text-right">기록</th>
            <th scope="col" className="px-2 py-1.5 text-right">단승</th>
            <th scope="col" className="px-2 py-1.5 text-right">연승</th>
            <th scope="col" className="px-2 py-1.5 text-right">마체중</th>
            <th scope="col" className="px-2 py-1.5">기수</th>
            <th scope="col" className="px-2 py-1.5">조교사</th>
          </tr>
        </thead>
        <tbody>
          {race.entries.map((entry) => {
            const chulNo = Number(entry.chulNo);
            const ord = Number(entry.ord);
            const canceled = !ord || Number(entry.noraceFlag) !== 0;
            const win = winByChul.get(chulNo);
            const plc = plcByChul.get(chulNo);
            return (
              <tr
                key={chulNo}
                className={`border-b border-foreground/10 hover:bg-foreground/5 ${
                  ord === 1 ? "font-semibold" : ""
                }`}
              >
                <td className="px-2 py-1.5">
                  {canceled ? "제외" : `${ord}착`}
                </td>
                <td className="px-2 py-1.5">{chulNo}</td>
                <td className="px-2 py-1.5 font-medium">
                  <NameLink value={entry.hrName} base="horses" />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {canceled ? "-" : clean(entry.rcTime)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {win == null ? "-" : formatOdds(win)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {plc == null ? "-" : formatOdds(plc)}
                </td>
                <td className="px-2 py-1.5 text-right">{clean(entry.wgHr)}</td>
                <td className="px-2 py-1.5">
                  <NameLink value={entry.jkName} base="jockeys" />
                </td>
                <td className="px-2 py-1.5">{clean(entry.trName)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
