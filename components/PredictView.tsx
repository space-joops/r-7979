import Link from "next/link";
import { DateNav } from "@/components/DateNav";
import { RaceJumpNav } from "@/components/RaceJumpNav";
import { TrackTabs } from "@/components/TrackTabs";
import { getJockeyStatsByMeet } from "@/lib/kra/jockeys";
import { getRacecard } from "@/lib/kra/racecard";
import { getResults } from "@/lib/kra/results";
import type { Track } from "@/lib/kra/tracks";
import { formatKoFull, todayKst } from "@/lib/kst";
import { toHorseInput } from "@/lib/predict/features";
import {
  MODEL_LABEL,
  MODEL_VERSION,
  scoreRace,
  type ScoredHorse,
} from "@/lib/predict/model-v1";

function pct(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

/** 기여도 상위 근거를 짧은 한국어로 요약 */
function reasonSummary(horse: ScoredHorse): string {
  const top = [...horse.contributions]
    .filter((c) => Math.abs(c.value) > 0.02)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 2);
  if (top.length === 0) return "판단 근거 부족 (경주 평균 수준)";
  return top
    .map((c) => `${c.labelKo} ${c.value > 0 ? "우위" : "열위"}`)
    .join(" · ");
}

function ContributionBars({ horse }: { horse: ScoredHorse }) {
  return (
    <table className="w-full text-xs">
      <caption className="sr-only">{horse.name} 피처 기여도</caption>
      <tbody>
        {horse.contributions.map((c) => (
          <tr key={c.feature}>
            <th scope="row" className="w-28 py-0.5 pr-2 text-left font-normal text-foreground/60">
              {c.labelKo}
            </th>
            <td className="py-0.5">
              <div className="relative h-2 w-full rounded bg-foreground/10">
                <div
                  className={`absolute top-0 h-2 rounded ${c.value >= 0 ? "left-1/2 bg-accent" : "right-1/2 bg-sand"}`}
                  style={{ width: `${Math.min(Math.abs(c.value) * 60, 50)}%` }}
                />
              </div>
            </td>
            <td className="w-16 py-0.5 pl-2 text-right tabular-nums text-foreground/60">
              {c.raw == null ? "결측" : c.value >= 0 ? `+${c.value.toFixed(2)}` : c.value.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 예측 본문 — 에버그린 허브와 날짜 페이지가 공유 */
export async function PredictView({
  track,
  date,
  heading,
}: {
  track: Track;
  date: string;
  heading: string;
}) {
  const isPast = date < todayKst();
  const [races, jockeys, results] = await Promise.all([
    getRacecard(track, date),
    getJockeyStatsByMeet(track),
    isPast ? getResults(track, date) : Promise.resolve([]),
  ]);

  // 경주별 채점 + (과거면) 실제 1착과 조인
  const winnerByRace = new Map(
    results.map((r) => [
      r.raceNo,
      r.entries.find((e) => Number(e.ord) === 1)?.hrName,
    ]),
  );
  const predictions = races.map((race) => {
    const scored = scoreRace(
      race.entries.map((e) => toHorseInput(e, jockeys)),
    );
    const winner = winnerByRace.get(race.raceNo);
    return {
      race,
      scored,
      winner,
      hit: winner != null && scored[0]?.name === winner,
      hitTop3:
        winner != null && scored.slice(0, 3).some((s) => s.name === winner),
    };
  });
  const judged = predictions.filter((p) => p.winner != null);
  const hits = judged.filter((p) => p.hit).length;
  const hitsTop3 = judged.filter((p) => p.hitTop3).length;

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{heading}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
        <span className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-xs">
          {MODEL_LABEL}
        </span>
        레이팅·기수 성적·부담중량 등 공공데이터 기반 통계 예측입니다.
      </p>
      <p className="mt-2 rounded-lg bg-sand-soft px-3 py-2 text-xs text-foreground/70">
        ⚠️ 본 예측은 정보 제공 목적의 통계 분석이며 적중을 보장하지 않습니다.
        구매(베팅)에 대한 판단과 책임은 이용자 본인에게 있습니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <TrackTabs section="predict" current={track.slug} />
        <DateNav section="predict" track={track} date={date} />
      </div>

      {judged.length > 0 && (
        <section className="mt-5 rounded-lg border border-foreground/15 p-4">
          <h2 className="font-semibold">
            이날 적중 성적{" "}
            <span className="ml-1 rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-xs">
              {MODEL_VERSION}
            </span>
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            1순위 적중 <strong>{hits}/{judged.length}</strong> (
            {((hits / judged.length) * 100).toFixed(0)}%) · 3순위 내 적중{" "}
            <strong>{hitsTop3}/{judged.length}</strong> (
            {((hitsTop3 / judged.length) * 100).toFixed(0)}%)
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            경주 결과가 확정된 날짜에는 예측과 실제 1착을 비교해 모델 성능을
            투명하게 공개합니다.
          </p>
        </section>
      )}

      {predictions.length === 0 ? (
        <p className="mt-10 rounded-lg bg-foreground/5 p-6 text-center text-foreground/70">
          {formatKoFull(date)} {track.nameKo} 출마표가 아직 발표되지 않아 예측을
          만들 수 없습니다.
        </p>
      ) : (
        <>
          <div className="mt-5">
            <RaceJumpNav
              races={predictions.map((p) => ({
                raceNo: p.race.raceNo,
                time: p.race.startTime,
              }))}
            />
          </div>
          <div className="mt-6 space-y-10">
            {predictions.map(({ race, scored, winner, hit }) => (
              <section key={race.raceNo} id={`race-${race.raceNo}`}>
                <h2 className="flex flex-wrap items-center gap-2 font-semibold">
                  {track.nameKo} 제{race.raceNo}경주 예상
                  {race.startTime && (
                    <span className="font-normal text-foreground/60">
                      발주 {race.startTime}
                    </span>
                  )}
                  {winner != null && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        hit
                          ? "bg-accent text-background"
                          : "bg-foreground/10 text-foreground/60"
                      }`}
                    >
                      {hit ? "1순위 적중 ✓" : `실제 1착 ${winner}`}
                    </span>
                  )}
                </h2>

                <ol className="mt-3 space-y-2">
                  {scored.map((horse) => (
                    <li
                      key={horse.gate}
                      className={`rounded-lg border p-3 ${
                        horse.rank === 1
                          ? "border-accent"
                          : horse.rank <= 3
                            ? "border-foreground/20"
                            : "border-foreground/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 shrink-0 text-center text-lg font-bold tabular-nums ${
                            horse.rank <= 3 ? "text-accent" : "text-foreground/40"
                          }`}
                        >
                          {horse.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-baseline gap-x-2">
                            <Link
                              href={`/horses/${encodeURIComponent(horse.name)}`}
                              className="font-semibold hover:text-accent hover:underline"
                            >
                              {horse.name}
                            </Link>
                            <span className="text-xs text-foreground/50">
                              {horse.gate}번 게이트
                            </span>
                            {winner === horse.name && (
                              <span className="text-xs font-bold text-sand">
                                실제 1착
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {reasonSummary(horse)}
                          </p>
                        </div>
                        <div className="w-24 shrink-0 text-right">
                          <span className="text-lg font-bold tabular-nums">
                            {pct(horse.prob)}
                          </span>
                          <div className="mt-1 h-1.5 w-full rounded bg-foreground/10">
                            <div
                              className="h-1.5 rounded bg-accent"
                              style={{ width: `${Math.min(horse.prob * 100 * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {horse.rank <= 3 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-accent hover:underline">
                            근거 자세히 보기
                          </summary>
                          <div className="mt-2">
                            <ContributionBars horse={horse} />
                          </div>
                        </details>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-sm">
                  <Link
                    href={`/racecard/${track.slug}/${date}/${race.raceNo}`}
                    className="text-accent hover:underline"
                  >
                    제{race.raceNo}경주 출전표·배당 보기 →
                  </Link>
                </p>
              </section>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 flex flex-wrap gap-4 text-sm text-foreground/60">
        <Link
          href={`/racecard/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          이날 출마표 보기
        </Link>
        <Link
          href={`/results/${track.slug}/${date}`}
          className="text-accent hover:underline"
        >
          경주결과 보기
        </Link>
      </p>
    </>
  );
}
