import Link from "next/link";
import { formatKo, todayKst, weekdayOf } from "@/lib/kst";
import { isRaceDay, nearestRaceDay, tracksRacingOn } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

/** 주간 개최 일정 (요일 → 경마장) — 홈 히어로 아래 상시 노출 */
const WEEKLY = [
  { weekday: 5, label: "금", tracks: ["부산경남", "제주"] },
  { weekday: 6, label: "토", tracks: ["서울", "제주"] },
  { weekday: 0, label: "일", tracks: ["서울", "부산경남"] },
] as const;

export default function Home() {
  const today = todayKst();
  const todayWeekday = weekdayOf(today);
  const racingToday = tracksRacingOn(today);
  const isRaceDayToday = racingToday.length > 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <section
        className={`rounded-xl p-6 ${
          isRaceDayToday ? "bg-sand-soft" : "bg-foreground/5"
        }`}
      >
        <p className="text-sm text-foreground/60">{formatKo(today)}</p>
        {isRaceDayToday ? (
          <>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              오늘은{" "}
              <span className="text-sand">
                {racingToday.map((t) => t.nameKo).join("·")}
              </span>{" "}
              경마일입니다
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {racingToday.map((track) => (
                <Link
                  key={track.slug}
                  href={`/racecard/${track.slug}/${today}`}
                  className="rounded-lg bg-accent px-4 py-2 font-semibold text-background"
                >
                  {track.nameKo} 출마표 보기
                </Link>
              ))}
              <Link
                href="/predict"
                className="rounded-lg border border-sand px-4 py-2 font-medium text-sand hover:bg-sand-soft"
              >
                오늘의 예상
              </Link>
              <Link
                href="/results"
                className="rounded-lg border border-foreground/20 px-4 py-2 font-medium hover:border-accent"
              >
                경주결과
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              오늘은 경마가 없는 날입니다
            </h1>
            <p className="mt-2 text-foreground/70">
              다음 경마는{" "}
              <strong>
                {formatKo(
                  TRACKS.map((t) => nearestRaceDay(t)).sort()[0],
                )}
              </strong>
              부터 시작합니다. 지난 경주결과를 먼저 확인해보세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/results"
                className="rounded-lg bg-accent px-4 py-2 font-semibold text-background"
              >
                지난 경주결과 보기
              </Link>
              <Link
                href="/racecard"
                className="rounded-lg border border-foreground/20 px-4 py-2 font-medium hover:border-accent"
              >
                다음 출마표
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">주간 개최 일정</h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          {WEEKLY.map((day) => {
            const isToday = day.weekday === todayWeekday;
            return (
              <li
                key={day.weekday}
                className={`rounded-lg border p-3 ${
                  isToday
                    ? "border-sand bg-sand-soft font-semibold"
                    : "border-foreground/10"
                }`}
              >
                <span className="block text-foreground/60">
                  {day.label}
                  {isToday && " · 오늘"}
                </span>
                <span className="mt-1 block">{day.tracks.join(" · ")}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">경마장별 출마표</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {TRACKS.map((track) => {
            const date = nearestRaceDay(track);
            const isTodayRacing = isRaceDay(track, today);
            return (
              <li key={track.slug}>
                <Link
                  href={`/racecard/${track.slug}/${date}`}
                  className="block rounded-lg border border-foreground/15 p-4 transition-colors hover:border-accent"
                >
                  <span className="flex items-center justify-between font-semibold">
                    {track.nameKo}
                    {isTodayRacing && (
                      <span className="rounded bg-sand-soft px-1.5 py-0.5 text-xs font-bold text-sand">
                        오늘 개최
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-foreground/60">
                    {isTodayRacing ? "오늘" : formatKo(date)} 출마표 →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 text-sm text-foreground/60">
        <h2 className="sr-only">서비스 소개</h2>
        <p>
          {SITE_NAME}는 서울·부산경남·제주 경마의 출마표, 경주결과, 확정
          배당률과 경주마·기수 전적을 경마일마다 업데이트해 제공합니다.
        </p>
      </section>
    </main>
  );
}
