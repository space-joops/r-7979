import Link from "next/link";
import { DateNav } from "@/components/DateNav";
import { DividendTable } from "@/components/DividendTable";
import { TrackTabs } from "@/components/TrackTabs";
import { getDividends } from "@/lib/kra/dividends";
import type { Track } from "@/lib/kra/tracks";
import { formatKoFull, todayKst } from "@/lib/kst";

/** 확정 배당률 본문 — 에버그린 허브와 날짜 페이지가 공유 */
export async function OddsView({
  track,
  date,
  heading,
}: {
  track: Track;
  date: string;
  heading: string;
}) {
  const races = await getDividends(track, date);
  const isFuture = date > todayKst();

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{heading}</h1>
      <p className="mt-2 text-sm text-foreground/60">
        경주 종료 후 확정된 배당률입니다. 실시간 배당률이 아닙니다.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <TrackTabs section="odds" current={track.slug} />
        <DateNav section="odds" track={track} date={date} />
      </div>

      {races.length === 0 ? (
        <p className="mt-10 rounded-lg bg-foreground/5 p-6 text-center text-foreground/70">
          {formatKoFull(date)} {track.nameKo} 확정 배당률이 아직 없습니다.
          <br />
          <span className="text-sm">
            {isFuture
              ? "경주가 아직 열리지 않았습니다. 경주 종료 후 확정 배당률이 공개됩니다."
              : "경주 진행 중이거나 데이터가 아직 집계되지 않았을 수 있습니다."}
          </span>
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {races.map((race) => (
            <section key={race.raceNo} id={`race-${race.raceNo}`}>
              <DividendTable race={race} trackName={track.nameKo} />
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-foreground/60">
        출전마 정보는{" "}
        <Link
          href={`/racecard/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          {track.nameKo} 출마표
        </Link>
        에서 확인할 수 있습니다.
      </p>
    </>
  );
}
