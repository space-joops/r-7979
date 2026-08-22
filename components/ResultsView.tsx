import Link from "next/link";
import { DateNav } from "@/components/DateNav";
import { RaceJumpNav } from "@/components/RaceJumpNav";
import { ResultsTable } from "@/components/ResultsTable";
import { TrackTabs } from "@/components/TrackTabs";
import { getDividends } from "@/lib/kra/dividends";
import { formatStartTime, getResults } from "@/lib/kra/results";
import type { Track } from "@/lib/kra/tracks";
import { formatKoFull, todayKst } from "@/lib/kst";

/** 경주결과 본문 — 에버그린 허브와 날짜 페이지가 공유 */
export async function ResultsView({
  track,
  date,
  heading,
}: {
  track: Track;
  date: string;
  heading: string;
}) {
  // 결과와 단승·연승 배당을 병렬 조회해 마번으로 조인
  const [races, dividends] = await Promise.all([
    getResults(track, date),
    getDividends(track, date, ["WIN", "PLC"]),
  ]);
  const dividendsByRace = new Map(dividends.map((d) => [d.raceNo, d]));
  const isToday = date === todayKst();

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{heading}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <TrackTabs section="results" current={track.slug} />
        <DateNav section="results" track={track} date={date} />
      </div>

      {races.length === 0 ? (
        <p className="mt-10 rounded-lg bg-foreground/5 p-6 text-center text-foreground/70">
          {formatKoFull(date)} {track.nameKo} 경주결과가 아직 없습니다.
          <br />
          <span className="text-sm">
            {isToday
              ? "경주 종료 후 순차적으로 공개됩니다. 잠시 후 다시 확인해주세요."
              : date > todayKst()
                ? "경주가 아직 열리지 않았습니다."
                : "데이터가 집계되지 않았을 수 있습니다."}
          </span>
        </p>
      ) : (
        <>
          <div className="mt-5">
            <RaceJumpNav
              races={races.map((r) => ({
                raceNo: r.raceNo,
                time: formatStartTime(r.startTime),
              }))}
            />
          </div>
          <div className="mt-6 space-y-10">
          {races.map((race) => (
            <section key={race.raceNo} id={`race-${race.raceNo}`}>
              <ResultsTable
                race={race}
                trackName={track.nameKo}
                winRows={dividendsByRace.get(race.raceNo)?.byPool.WIN}
                plcRows={dividendsByRace.get(race.raceNo)?.byPool.PLC}
              />
            </section>
          ))}
          </div>
        </>
      )}

      <p className="mt-10 flex flex-wrap gap-4 text-sm text-foreground/60">
        <Link
          href={`/racecard/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          이날 출마표 보기
        </Link>
        <Link
          href={`/odds/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          전체 확정 배당률 보기
        </Link>
      </p>
    </>
  );
}
