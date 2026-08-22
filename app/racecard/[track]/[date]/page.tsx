import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RacecardView } from "@/components/RacecardView";
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
}: PageProps<"/racecard/[track]/[date]">): Promise<Metadata> {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) return {};
  return {
    title: `${formatKo(date)} ${track.nameKo} 경마 출마표`,
    description: `${formatKo(date)} ${track.parkName} 경마 출마표. 경주별 마명, 기수, 조교사, 부담중량, 레이팅, 발주시각을 확인하세요.`,
    alternates: { canonical: `/racecard/${slug}/${date}` },
  };
}

export default async function DatedRacecard({
  params,
}: PageProps<"/racecard/[track]/[date]">) {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "출마표", href: "/racecard" },
          { name: `${track.nameKo} 출마표`, href: `/racecard/${track.slug}` },
          { name: formatKo(date) },
        ]}
      />
      <RacecardView
        track={track}
        date={date}
        heading={`${formatKo(date)} ${track.nameKo} 경마 출마표`}
      />
    </main>
  );
}
