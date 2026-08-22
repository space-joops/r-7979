import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatKo, todayKst } from "@/lib/kst";
import { isRaceDay, prevRaceDay, raceDates } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { addDays } from "@/lib/kst";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "경마 경주결과 — 착순·기록·배당",
  description:
    "서울·부산경남·제주 경마 경주결과를 개최일별로 확인하세요. 착순, 완주 기록, 단승·연승 배당, 기수·조교사 정보 제공.",
  alternates: { canonical: "/results" },
};

export default function ResultsHub() {
  const today = todayKst();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "경주결과" }]} />
      <h1 className="mt-4 text-2xl font-bold">경마 경주결과</h1>
      <p className="mt-2 text-foreground/70">
        경마장을 선택하면 개최일별 경주결과를 볼 수 있습니다.
      </p>
      <div className="mt-6 space-y-8">
        {TRACKS.map((track) => {
          const latest = isRaceDay(track, today)
            ? today
            : prevRaceDay(track, today);
          const recent = raceDates(track, addDays(today, -14), today).reverse();
          return (
            <section key={track.slug}>
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/results/${track.slug}`}
                  className="hover:underline"
                >
                  {track.nameKo} 경주결과 →
                </Link>
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                최근 개최 {formatKo(latest)}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {recent.map((date) => (
                  <li key={date}>
                    <Link
                      href={`/results/${track.slug}/${date}`}
                      className="rounded-lg bg-foreground/5 px-3 py-1.5 text-sm hover:bg-foreground/10"
                    >
                      {formatKo(date)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
