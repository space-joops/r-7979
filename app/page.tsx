import Link from "next/link";
import { formatKo, todayKst } from "@/lib/kst";
import { isRaceDay, nearestRaceDay, tracksRacingOn } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

export default function Home() {
  const today = todayKst();
  const racingToday = tracksRacingOn(today);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">{SITE_NAME}</h1>
      <p className="mt-2 text-foreground/70">
        서울·부산경남·제주 경마 출마표와 확정 배당률을 한눈에 확인하세요.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {racingToday.length > 0
            ? `오늘(${formatKo(today)})은 경마일입니다 🏇`
            : `오늘(${formatKo(today)})은 경마가 없는 날입니다`}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRACKS.map((track) => {
            const date = nearestRaceDay(track);
            const isToday = isRaceDay(track, today);
            return (
              <li key={track.slug}>
                <Link
                  href={`/racecard/${track.slug}/${date}`}
                  className="block rounded-lg border border-foreground/15 p-4 transition-colors hover:border-accent"
                >
                  <span className="block font-semibold">{track.nameKo}</span>
                  <span className="mt-1 block text-sm text-foreground/60">
                    {isToday ? "오늘 개최" : `다음 개최 ${formatKo(date)}`}
                  </span>
                  <span className="mt-2 block text-sm text-accent">
                    출마표 보기 →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">바로가기</h2>
        <nav aria-label="주요 메뉴" className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/racecard"
            className="rounded-lg bg-foreground/5 px-4 py-2 font-medium hover:bg-foreground/10"
          >
            출마표
          </Link>
          <Link
            href="/results"
            className="rounded-lg bg-foreground/5 px-4 py-2 font-medium hover:bg-foreground/10"
          >
            경주결과
          </Link>
          <Link
            href="/odds"
            className="rounded-lg bg-foreground/5 px-4 py-2 font-medium hover:bg-foreground/10"
          >
            확정 배당률
          </Link>
        </nav>
      </section>

      <section className="mt-10 text-sm text-foreground/60">
        <h2 className="font-semibold text-foreground/80">경마 개최 안내</h2>
        <ul className="mt-2 space-y-1">
          <li>서울(렛츠런파크 서울, 과천): 매주 토·일</li>
          <li>부산경남(렛츠런파크 부산경남): 매주 금·일</li>
          <li>제주(렛츠런파크 제주): 매주 금·토</li>
        </ul>
      </section>
    </main>
  );
}
