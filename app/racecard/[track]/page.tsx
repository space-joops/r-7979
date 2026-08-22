import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RacecardView } from "@/components/RacecardView";
import { nearestRaceDay } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { formatKo } from "@/lib/kst";

export const revalidate = 3600;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/racecard/[track]">): Promise<Metadata> {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) return {};
  return {
    title: `${track.nameKo}경마 출마표 — 오늘·이번주 출전표`,
    description: `${track.parkName} 경마 출마표를 확인하세요. 마명, 기수, 조교사, 부담중량, 발주시각 정보 제공. 가장 가까운 개최일 출마표를 바로 보여드립니다.`,
    alternates: { canonical: `/racecard/${slug}` },
  };
}

/** 에버그린 허브 — "서울경마 출마표" 등 헤드 키워드 타깃. 가장 가까운 개최일을 인라인 표시 */
export default async function TrackRacecardHub({
  params,
}: PageProps<"/racecard/[track]">) {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) notFound();
  const date = nearestRaceDay(track);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "출마표", href: "/racecard" },
          { name: `${track.nameKo} 출마표` },
        ]}
      />
      <RacecardView
        track={track}
        date={date}
        heading={`${track.nameKo}경마 출마표 — ${formatKo(date)}`}
      />
    </main>
  );
}
