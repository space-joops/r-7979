import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ResultsView } from "@/components/ResultsView";
import { isRaceDay, raceDates } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { addDays, formatKo, isValidYmd, todayKst } from "@/lib/kst";

export const revalidate = 3600;

export function generateStaticParams() {
  const today = todayKst();
  return TRACKS.flatMap((track) =>
    raceDates(track, addDays(today, -7), today).map((date) => ({
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
}: PageProps<"/results/[track]/[date]">): Promise<Metadata> {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) return {};
  return {
    title: `${formatKo(date)} ${track.nameKo} 경마 경주결과`,
    description: `${formatKo(date)} ${track.parkName} 경마 경주결과. 경주별 착순, 완주 기록, 단승·연승 배당, 기수·조교사를 확인하세요.`,
    alternates: { canonical: `/results/${slug}/${date}` },
  };
}

export default async function DatedResults({
  params,
}: PageProps<"/results/[track]/[date]">) {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "경주결과", href: "/results" },
          { name: `${track.nameKo} 결과`, href: `/results/${track.slug}` },
          { name: formatKo(date) },
        ]}
      />
      <ResultsView
        track={track}
        date={date}
        heading={`${formatKo(date)} ${track.nameKo} 경마 경주결과`}
      />
    </main>
  );
}
