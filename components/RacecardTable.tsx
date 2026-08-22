import type { RaceGroup } from "@/lib/kra/racecard";

/** API 응답의 빈 값 변형(" ", "()", 0 등)을 "-"로 정리 */
function clean(value: string | number | undefined): string {
  const s = String(value ?? "").trim();
  if (!s || s === "()" || s === "0") return "-";
  return s;
}

/** 출전표 테이블 — 시맨틱 마크업(caption/thead/th scope)으로 SEO·접근성 확보 */
export function RacecardTable({ race, trackName }: { race: RaceGroup; trackName: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="mb-2 text-left font-semibold">
          {trackName} 제{race.raceNo}경주 {race.raceName}
          {race.startTime && (
            <span className="ml-2 font-normal text-foreground/60">
              발주 <time>{race.startTime}</time>
            </span>
          )}
        </caption>
        <thead>
          <tr className="border-b-2 border-foreground/20 text-left">
            <th scope="col" className="px-2 py-1.5">번호</th>
            <th scope="col" className="px-2 py-1.5">마명</th>
            <th scope="col" className="px-2 py-1.5">성별/마령</th>
            <th scope="col" className="px-2 py-1.5">산지</th>
            <th scope="col" className="px-2 py-1.5 text-right">부담중량</th>
            <th scope="col" className="px-2 py-1.5 text-right">레이팅</th>
            <th scope="col" className="px-2 py-1.5">기수</th>
            <th scope="col" className="px-2 py-1.5">조교사</th>
          </tr>
        </thead>
        <tbody>
          {race.entries.map((entry) => (
            <tr
              key={String(entry.gtno)}
              className="border-b border-foreground/10 hover:bg-foreground/5"
            >
              <td className="px-2 py-1.5 font-semibold">{String(entry.gtno)}</td>
              <td className="px-2 py-1.5 font-medium">{entry.hrnm}</td>
              <td className="px-2 py-1.5">
                {[entry.gndrNm, entry.hrsAg && `${entry.hrsAg}세`]
                  .filter(Boolean)
                  .join(" ")}
              </td>
              <td className="px-2 py-1.5">{clean(entry.prdsNm)}</td>
              <td className="px-2 py-1.5 text-right">
                {entry.burdWgt ? `${entry.burdWgt}kg` : "-"}
              </td>
              <td className="px-2 py-1.5 text-right">{clean(entry.rating)}</td>
              <td className="px-2 py-1.5">{clean(entry.jckyNm)}</td>
              <td className="px-2 py-1.5">{clean(entry.trarNm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
