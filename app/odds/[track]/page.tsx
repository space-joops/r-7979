import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OddsView } from "@/components/OddsView";
import { isRaceDay, prevRaceDay } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { formatKo, todayKst } from "@/lib/kst";

export const revalidate = 300;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/odds/[track]">): Promise<Metadata> {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) return {};
  return {
    title: `${track.nameKo} 경마 확정 배당률`,
    description: `${track.parkName} 경마 확정 배당률. 단승, 연승, 복승, 쌍승 배당률을 경주별로 확인하세요. 최근 개최일 배당률을 바로 보여드립니다.`,
    alternates: { canonical: `/odds/${slug}` },
  };
}

/** 에버그린 허브 — "서울 경마 배당률" 등 헤드 키워드 타깃. 최근 개최일(오늘 포함)을 인라인 표시 */
export default async function TrackOddsHub({
  params,
}: PageProps<"/odds/[track]">) {
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
          { name: "확정 배당률", href: "/odds" },
          { name: `${track.nameKo} 배당률` },
        ]}
      />
      <OddsView
        track={track}
        date={date}
        heading={`${track.nameKo} 경마 확정 배당률 — ${formatKo(date)}`}
      />
    </main>
  );
}
