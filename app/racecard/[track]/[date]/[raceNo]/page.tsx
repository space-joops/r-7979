import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DividendTable } from "@/components/DividendTable";
import { JsonLd } from "@/components/JsonLd";
import { RacecardTable } from "@/components/RacecardTable";
import { getDividends } from "@/lib/kra/dividends";
import { getRacecard } from "@/lib/kra/racecard";
import { isRaceDay } from "@/lib/kra/schedule";
import { trackBySlug } from "@/lib/kra/tracks";
import { formatKo, isValidYmd, toIsoDate } from "@/lib/kst";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

function validate(slug: string, date: string, raceNoRaw: string) {
  const track = trackBySlug(slug);
  const raceNo = Number(raceNoRaw);
  if (
    !track ||
    !isValidYmd(date) ||
    !isRaceDay(track, date) ||
    !Number.isInteger(raceNo) ||
    raceNo < 1 ||
    raceNo > 20
  ) {
    return null;
  }
  return { track, raceNo };
}

export async function generateMetadata({
  params,
}: PageProps<"/racecard/[track]/[date]/[raceNo]">): Promise<Metadata> {
  const { track: slug, date, raceNo: raceNoRaw } = await params;
  const valid = validate(slug, date, raceNoRaw);
  if (!valid) return {};
  const { track, raceNo } = valid;
  return {
    title: `${formatKo(date)} ${track.nameKo} 제${raceNo}경주 출전마·확정 배당률`,
    description: `${formatKo(date)} ${track.parkName} 제${raceNo}경주 출전마 명단과 확정 배당률. 마명, 기수, 조교사, 부담중량 정보 제공.`,
    alternates: { canonical: `/racecard/${slug}/${date}/${raceNo}` },
  };
}

export default async function RaceDetail({
  params,
}: PageProps<"/racecard/[track]/[date]/[raceNo]">) {
  const { track: slug, date, raceNo: raceNoRaw } = await params;
  const valid = validate(slug, date, raceNoRaw);
  if (!valid) notFound();
  const { track, raceNo } = valid;

  const [races, dividends] = await Promise.all([
    getRacecard(track, date),
    getDividends(track, date),
  ]);
  const race = races.find((r) => r.raceNo === raceNo);
  const raceDividends = dividends.find((d) => d.raceNo === raceNo);
  if (!race && !raceDividends) notFound();

  const startIso = race?.startTime
    ? `${toIsoDate(date)}T${race.startTime}:00+09:00`
    : toIsoDate(date);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "출마표", href: "/racecard" },
          { name: `${track.nameKo} 출마표`, href: `/racecard/${track.slug}` },
          { name: formatKo(date), href: `/racecard/${track.slug}/${date}` },
          { name: `제${raceNo}경주` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">
        {formatKo(date)} {track.nameKo} 제{raceNo}경주
        {race?.raceName ? ` — ${race.raceName}` : ""}
      </h1>
      {race?.conditions.length ? (
        <p className="mt-2 text-sm text-foreground/60">
          {race.conditions.join(" · ")}
        </p>
      ) : null}

      {race && (
        <section className="mt-8">
          <h2 className="sr-only">출전마 명단</h2>
          <RacecardTable race={race} trackName={track.nameKo} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">확정 배당률</h2>
        {raceDividends ? (
          <div className="mt-3">
            <DividendTable race={raceDividends} trackName={track.nameKo} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground/60">
            아직 확정 배당률이 발표되지 않았습니다. 경주 종료 후 공개됩니다.
          </p>
        )}
      </section>

      <p className="mt-10 text-sm">
        <Link
          href={`/racecard/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          ← {formatKo(date)} 전체 출마표
        </Link>
      </p>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: `${track.nameKo} 제${raceNo}경주${race?.raceName ? ` ${race.raceName}` : ""}`,
          sport: "Horse racing",
          startDate: startIso,
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: track.parkName,
            address: track.address,
          },
          url: `${SITE_URL}/racecard/${track.slug}/${date}/${raceNo}`,
        }}
      />
    </main>
  );
}
