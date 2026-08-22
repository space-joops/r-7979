import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatKo, todayKst } from "@/lib/kst";
import { prevRaceDay } from "@/lib/kra/schedule";
import { isRaceDay } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "경마 확정 배당률 — 단승·연승·복승·쌍승",
  description:
    "서울·부산경남·제주 경마 확정 배당률을 개최일별로 확인하세요. 단승, 연승, 복승, 쌍승 배당률 제공.",
  alternates: { canonical: "/odds" },
};

export default function OddsHub() {
  const today = todayKst();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "확정 배당률" }]} />
      <h1 className="mt-4 text-2xl font-bold">경마 확정 배당률</h1>
      <p className="mt-2 text-foreground/70">
        경주 종료 후 확정된 배당률을 경마장·개최일별로 제공합니다.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {TRACKS.map((track) => {
          const latest = isRaceDay(track, today)
            ? today
            : prevRaceDay(track, today);
          return (
            <li key={track.slug}>
              <Link
                href={`/odds/${track.slug}`}
                className="block rounded-lg border border-foreground/15 p-4 transition-colors hover:border-accent"
              >
                <span className="block font-semibold">{track.nameKo}</span>
                <span className="mt-1 block text-sm text-foreground/60">
                  최근 개최 {formatKo(latest)}
                </span>
                <span className="mt-2 block text-sm text-accent">
                  배당률 보기 →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
