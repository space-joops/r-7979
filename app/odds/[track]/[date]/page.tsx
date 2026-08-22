import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OddsView } from "@/components/OddsView";
import { isRaceDay, raceDates } from "@/lib/kra/schedule";
import { trackBySlug, TRACKS } from "@/lib/kra/tracks";
import { addDays, formatKo, isValidYmd, todayKst } from "@/lib/kst";

export const revalidate = 300;

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
}: PageProps<"/odds/[track]/[date]">): Promise<Metadata> {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) return {};
  return {
    title: `${formatKo(date)} ${track.nameKo} 경마 확정 배당률`,
    description: `${formatKo(date)} ${track.parkName} 경마 확정 배당률. 단승, 연승, 복승, 쌍승 배당률을 경주별로 확인하세요.`,
    alternates: { canonical: `/odds/${slug}/${date}` },
  };
}

export default async function DatedOdds({
  params,
}: PageProps<"/odds/[track]/[date]">) {
  const { track: slug, date } = await params;
  const track = validate(slug, date);
  if (!track) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "확정 배당률", href: "/odds" },
          { name: `${track.nameKo} 배당률`, href: `/odds/${track.slug}` },
          { name: formatKo(date) },
        ]}
      />
      <OddsView
        track={track}
        date={date}
        heading={`${formatKo(date)} ${track.nameKo} 경마 확정 배당률`}
      />
    </main>
  );
}
