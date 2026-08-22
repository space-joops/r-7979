import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatKo, todayKst } from "@/lib/kst";
import { nearestRaceDay } from "@/lib/kra/schedule";
import { isRaceDay } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { MODEL_LABEL } from "@/lib/predict/model-v1";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "경마 예상 — 데이터 기반 예측",
  description:
    "서울·부산경남·제주 경마 예상. 레이팅, 기수 성적, 부담중량 등 공공데이터를 통계 모델로 분석한 경주별 예측과 적중 성적을 확인하세요.",
  alternates: { canonical: "/predict" },
};

export default function PredictHub() {
  const today = todayKst();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "예측" }]} />
      <h1 className="mt-4 text-2xl font-bold">경마 예상</h1>
      <p className="mt-2 text-foreground/70">
        한국마사회 공공데이터를 통계 모델(
        <span className="font-mono text-sm">{MODEL_LABEL}</span>)로 분석한
        경주별 예측입니다. 결과가 확정된 날짜에는 적중 성적을 함께 공개합니다.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {TRACKS.map((track) => {
          const date = nearestRaceDay(track);
          const isTodayRacing = isRaceDay(track, today);
          return (
            <li key={track.slug}>
              <Link
                href={`/predict/${track.slug}`}
                className="block rounded-lg border border-foreground/15 p-4 transition-colors hover:border-accent"
              >
                <span className="flex items-center justify-between font-semibold">
                  {track.nameKo}
                  {isTodayRacing && (
                    <span className="rounded bg-sand-soft px-1.5 py-0.5 text-xs font-bold text-sand">
                      오늘 개최
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-foreground/60">
                  {isTodayRacing ? "오늘" : formatKo(date)} 예상 →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-xs text-foreground/50">
        본 예측은 정보 제공 목적이며 적중을 보장하지 않습니다. 구매에 대한
        판단과 책임은 이용자 본인에게 있습니다.
      </p>
    </main>
  );
}
