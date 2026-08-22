import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatKo, todayKst } from "@/lib/kst";
import { nearestRaceDay, raceDates } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { addDays } from "@/lib/kst";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "경마 출마표 — 서울·부산경남·제주",
  description:
    "서울·부산경남·제주 경마 출마표(출전표)를 개최일별로 확인하세요. 마명, 기수, 조교사, 부담중량, 레이팅 정보 제공.",
  alternates: { canonical: "/racecard" },
};

export default function RacecardHub() {
  const today = todayKst();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "출마표" }]} />
      <h1 className="mt-4 text-2xl font-bold">경마 출마표</h1>
      <p className="mt-2 text-foreground/70">
        경마장을 선택하면 개최일별 출마표를 볼 수 있습니다.
      </p>
      <div className="mt-6 space-y-8">
        {TRACKS.map((track) => {
          const upcoming = raceDates(track, today, addDays(today, 7));
          return (
            <section key={track.slug}>
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/racecard/${track.slug}`}
                  className="hover:underline"
                >
                  {track.nameKo} 출마표 →
                </Link>
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {upcoming.map((date) => (
                  <li key={date}>
                    <Link
                      href={`/racecard/${track.slug}/${date}`}
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
      <p className="mt-8 text-sm text-foreground/60">
        가장 가까운 개최일:{" "}
        {TRACKS.map((t) => `${t.nameKo} ${formatKo(nearestRaceDay(t))}`).join(" · ")}
      </p>
    </main>
  );
}
