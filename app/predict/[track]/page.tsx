import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PredictView } from "@/components/PredictView";
import { nearestRaceDay } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { formatKo } from "@/lib/kst";

export const revalidate = 3600;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/predict/[track]">): Promise<Metadata> {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) return {};
  return {
    title: `${track.nameKo} 경마 예상`,
    description: `${track.parkName} 경마 예상. 레이팅·기수 성적·부담중량 기반 통계 모델의 경주별 예측을 확인하세요. 가장 가까운 개최일 예상을 바로 보여드립니다.`,
    alternates: { canonical: `/predict/${slug}` },
  };
}

/** 에버그린 허브 — "서울 경마 예상" 키워드 타깃. 가장 가까운 개최일 예측 인라인 */
export default async function TrackPredictHub({
  params,
}: PageProps<"/predict/[track]">) {
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) notFound();
  const date = nearestRaceDay(track);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "예측", href: "/predict" },
          { name: `${track.nameKo} 예상` },
        ]}
      />
      <PredictView
        track={track}
        date={date}
        heading={`${track.nameKo} 경마 예상 — ${formatKo(date)}`}
      />
    </main>
  );
}
