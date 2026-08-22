import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { num, rate, StatTable } from "@/components/StatTable";
import {
  formatPrize,
  formatYmdNum,
  getHorseProfile,
  isValidProfileName,
} from "@/lib/kra/profiles";
import { trackByApiName } from "@/lib/kra/tracks";

export const revalidate = 86400;

function decodeName(raw: string): string | null {
  try {
    const name = decodeURIComponent(raw).trim();
    return isValidProfileName(name) ? name : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/horses/[name]">): Promise<Metadata> {
  const { name: raw } = await params;
  const name = decodeName(raw);
  if (!name) return {};
  return {
    title: `${name} — 경주마 전적·성적`,
    description: `경주마 ${name}의 통산·최근 1년 성적, 승률, 연대율, 착순 상금과 최근 출주 기록을 확인하세요.`,
    alternates: { canonical: `/horses/${encodeURIComponent(name)}` },
  };
}

export default async function HorsePage({ params }: PageProps<"/horses/[name]">) {
  const { name: raw } = await params;
  const name = decodeName(raw);
  if (!name) notFound();

  const { exact, similarNames, yearSummary } = await getHorseProfile(name);
  if (exact.length === 0 && similarNames.length === 0) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "출마표", href: "/racecard" },
          { name: `경주마 ${name}` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">경주마 {name}</h1>

      {exact.length === 0 ? (
        <p className="mt-6 rounded-lg bg-foreground/5 p-6 text-foreground/70">
          &ldquo;{name}&rdquo;과 정확히 일치하는 경주마가 없습니다. 아래 비슷한
          이름을 확인해보세요.
        </p>
      ) : (
        exact.map((horse) => {
          const recentTrack = horse.meet ? trackByApiName(horse.meet) : undefined;
          const recentDate = String(horse.recentRcDate ?? "");
          return (
            <article key={horse.hrNo} className="mt-6 space-y-8">
              <section>
                <h2 className="sr-only">기본 정보</h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-foreground/5 p-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-foreground/60">소속</dt>
                    <dd className="font-medium">{horse.meet ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">성별 / 나이</dt>
                    <dd className="font-medium">
                      {[horse.sex, horse.age && `${horse.age}세`]
                        .filter(Boolean)
                        .join(" / ") || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">산지</dt>
                    <dd className="font-medium">{horse.name ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">데뷔</dt>
                    <dd className="font-medium">{formatYmdNum(horse.debut)}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">마번</dt>
                    <dd className="font-medium">{horse.hrNo}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <StatTable
                  caption={`${name} 성적`}
                  rows={[
                    { label: "출주", total: num(horse.rcCntT), year: num(horse.rcCntY) },
                    { label: "1착", total: num(horse.ord1CntT), year: num(horse.ord1CntY) },
                    { label: "2착", total: num(horse.ord2CntT), year: num(horse.ord2CntY) },
                    { label: "승률", total: rate(horse.winRateT), year: rate(horse.winRateY) },
                    { label: "연대율", total: rate(horse.qnlRateT), year: rate(horse.qnlRateY) },
                    {
                      label: "상금",
                      total: formatPrize(horse.chaksunT),
                      year: formatPrize(horse.chaksunY),
                    },
                  ]}
                />
              </section>

              {yearSummary && (
                <section>
                  <h2 className="font-semibold">최근 1년 착순 분포</h2>
                  <p className="mt-2 text-sm text-foreground/80">
                    출주 {num(yearSummary.loyPtinTcnt)}회 — 1착{" "}
                    {num(yearSummary.loyFcmTcnt)}회 · 2착{" "}
                    {num(yearSummary.loyScmTcnt)}회 · 3착{" "}
                    {num(yearSummary.loyTcmTcnt)}회 · 4착{" "}
                    {num(yearSummary.loyFocmTcnt)}회 · 5착{" "}
                    {num(yearSummary.loyFvcmTcnt)}회 · 1년 상금{" "}
                    {formatPrize(yearSummary.loyPlcpmAmt)}
                  </p>
                </section>
              )}

              {horse.recentRcDate ? (
                <section>
                  <h2 className="font-semibold">최근 출주</h2>
                  <p className="mt-2 text-sm text-foreground/80">
                    {formatYmdNum(horse.recentRcDate)} {horse.meet} 제
                    {String(horse.recentRcNo ?? "?")}경주 ({horse.recentRank ?? "-"}{" "}
                    {horse.recentRcDist ? `${horse.recentRcDist}m` : ""}) —{" "}
                    <strong>
                      {horse.recentOrd ? `${horse.recentOrd}착` : "-"}
                    </strong>
                    {horse.recentRcTime ? `, 기록 ${horse.recentRcTime}초` : ""}
                  </p>
                  {recentTrack && /^\d{8}$/.test(recentDate) && (
                    <p className="mt-2 text-sm">
                      <Link
                        href={`/results/${recentTrack.slug}/${recentDate}#race-${horse.recentRcNo}`}
                        className="text-accent hover:underline"
                      >
                        해당 경주결과 보기 →
                      </Link>
                    </p>
                  )}
                </section>
              ) : null}
            </article>
          );
        })
      )}

      {similarNames.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold">비슷한 이름의 경주마</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {similarNames.map((other) => (
              <li key={other}>
                <Link
                  href={`/horses/${encodeURIComponent(other)}`}
                  className="rounded-lg bg-foreground/5 px-3 py-1.5 text-sm hover:bg-foreground/10"
                >
                  {other}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
