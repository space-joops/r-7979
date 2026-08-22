import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { num, rate, StatTable } from "@/components/StatTable";
import { getJockeyProfile, isValidProfileName } from "@/lib/kra/profiles";

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
}: PageProps<"/jockeys/[name]">): Promise<Metadata> {
  const { name: raw } = await params;
  const name = decodeName(raw);
  if (!name) return {};
  return {
    title: `${name} 기수 — 성적·승률`,
    description: `기수 ${name}의 통산·최근 1년 출주 성적, 승률, 연대율을 확인하세요.`,
    alternates: { canonical: `/jockeys/${encodeURIComponent(name)}` },
  };
}

export default async function JockeyPage({
  params,
}: PageProps<"/jockeys/[name]">) {
  const { name: raw } = await params;
  const name = decodeName(raw);
  if (!name) notFound();

  const { exact, similarNames } = await getJockeyProfile(name);
  if (exact.length === 0 && similarNames.length === 0) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "홈", href: "/" },
          { name: "출마표", href: "/racecard" },
          { name: `기수 ${name}` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">기수 {name}</h1>

      {exact.length === 0 ? (
        <p className="mt-6 rounded-lg bg-foreground/5 p-6 text-foreground/70">
          &ldquo;{name}&rdquo;과 정확히 일치하는 기수가 없습니다. 아래 비슷한
          이름을 확인해보세요.
        </p>
      ) : (
        exact.map((jockey) => (
          <article key={jockey.jkNo} className="mt-6 space-y-4">
            <p className="text-sm text-foreground/60">
              소속: <strong className="text-foreground">{jockey.meet ?? "-"}</strong>
              <span className="ml-3">기수번호 {jockey.jkNo}</span>
            </p>
            <StatTable
              caption={`${name} 기수 성적${jockey.meet ? ` (${jockey.meet})` : ""}`}
              rows={[
                { label: "출주", total: num(jockey.rcCntT), year: num(jockey.rcCntY) },
                { label: "1착", total: num(jockey.ord1CntT), year: num(jockey.ord1CntY) },
                { label: "2착", total: num(jockey.ord2CntT), year: num(jockey.ord2CntY) },
                { label: "승률", total: rate(jockey.winRateT), year: rate(jockey.winRateY) },
                { label: "연대율", total: rate(jockey.qnlRateT), year: rate(jockey.qnlRateY) },
              ]}
            />
          </article>
        ))
      )}

      {similarNames.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold">비슷한 이름의 기수</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {similarNames.map((other) => (
              <li key={other}>
                <Link
                  href={`/jockeys/${encodeURIComponent(other)}`}
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
