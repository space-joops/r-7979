import Link from "next/link";
import { DateNav } from "@/components/DateNav";
import { RaceJumpNav } from "@/components/RaceJumpNav";
import { RacecardTable } from "@/components/RacecardTable";
import { TrackTabs } from "@/components/TrackTabs";
import { getRacecard } from "@/lib/kra/racecard";
import type { Track } from "@/lib/kra/tracks";
import { formatKoFull } from "@/lib/kst";

/** 출마표 본문 — 에버그린 허브와 날짜 페이지가 공유 */
export async function RacecardView({
  track,
  date,
  heading,
}: {
  track: Track;
  date: string;
  heading: string;
}) {
  const races = await getRacecard(track, date);

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{heading}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <TrackTabs section="racecard" current={track.slug} />
        <DateNav section="racecard" track={track} date={date} />
      </div>

      {races.length === 0 ? (
        <p className="mt-10 rounded-lg bg-foreground/5 p-6 text-center text-foreground/70">
          {formatKoFull(date)} {track.nameKo} 출마표가 아직 발표되지 않았습니다.
          <br />
          <span className="text-sm">
            출마표는 보통 개최일 며칠 전에 공개됩니다. 잠시 후 다시 확인해주세요.
          </span>
        </p>
      ) : (
        <>
          <div className="mt-5">
            <RaceJumpNav
              races={races.map((r) => ({ raceNo: r.raceNo, time: r.startTime }))}
            />
          </div>
          <div className="mt-6 space-y-10">
          {races.map((race) => (
            <section key={race.raceNo} id={`race-${race.raceNo}`}>
              <RacecardTable race={race} trackName={track.nameKo} />
              <p className="mt-2 text-sm">
                <Link
                  href={`/racecard/${track.slug}/${date}/${race.raceNo}`}
                  className="text-accent hover:underline"
                >
                  제{race.raceNo}경주 상세 보기 →
                </Link>
              </p>
            </section>
          ))}
          </div>
        </>
      )}

      <p className="mt-10 flex flex-wrap gap-4 text-sm text-foreground/60">
        <Link
          href={`/results/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          이날 경주결과 보기
        </Link>
        <Link
          href={`/odds/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          확정 배당률 보기
        </Link>
      </p>
    </>
  );
}
