import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ResultsView } from "@/components/ResultsView";
import { isRaceDay, prevRaceDay } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { formatKo, todayKst } from "@/lib/kst";

export const revalidate = 3600;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/results/[track]">): Promise<Metadata> {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) return {};
  return {
    title: `${track.nameKo} 경마 경주결과`,
    description: `${track.parkName} 경마 경주결과. 착순, 완주 기록, 단승·연승 배당을 경주별로 확인하세요. 최근 개최일 결과를 바로 보여드립니다.`,
    alternates: { canonical: `/results/${slug}` },
  };
}

/** 에버그린 허브 — "서울 경마 결과" 등 키워드 타깃. 최근 개최일(오늘 포함) 결과 인라인 */
export default async function TrackResultsHub({
  params,
}: PageProps<"/results/[track]">) {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) notFound();
  const today = todayKst();
  const date = isRaceDay(track, today) ? today : prevRaceDay(track, today);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "경주결과", href: "/results" },
          { name: `${track.nameKo} 결과` },
        ]}
      />
      <ResultsView
        track={track}
        date={date}
        heading={`${track.nameKo} 경마 경주결과 — ${formatKo(date)}`}
      />
    </main>
  );
}
