import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PredictView } from "@/components/PredictView";
import { isRaceDay, raceDates } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { addDays, formatKo, isValidYmd, todayKst } from "@/lib/kst";

export const revalidate = 3600;

export function generateStaticParams() {
  const today = todayKst();
  return TRACKS.flatMap((track) =>
    raceDates(track, addDays(today, -7), addDays(today, 7)).map((date) => ({
      track: track.slug,
      date,
    })),
  );
}

function validate(slug: string, date: string) {
  const track = trackBySlug(slug);
  if (!track || !isValidYmd(date) || !isRaceDay(track, date)) return null;
  return track;
}

export async function generateMetadata({
  params,
}: PageProps<"/predict/[track]/[date]">): Promise<Metadata> {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) return {};
  return {
    title: `${formatKo(date)} ${track.nameKo} 경마 예상`,
    description: `${formatKo(date)} ${track.parkName} 경마 예상. 통계 모델의 경주별 예측 순위와 승리 확률, 판단 근거를 확인하세요.`,
    alternates: { canonical: `/predict/${slug}/${date}` },
  };
}

export default async function DatedPredict({
  params,
}: PageProps<"/predict/[track]/[date]">) {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "예측", href: "/predict" },
          { name: `${track.nameKo} 예상`, href: `/predict/${track.slug}` },
          { name: formatKo(date) },
        ]}
      />
      <PredictView
        track={track}
        date={date}
        heading={`${formatKo(date)} ${track.nameKo} 경마 예상`}
      />
    </main>
  );
}
