import Link from "next/link";
import { formatKo, toIsoDate } from "@/lib/kst";
import { nextRaceDay, prevRaceDay } from "@/lib/kra/schedule";
import type { Track } from "@/lib/kra/tracks";

interface Props {
  section: string;
  track: Track;
  date: string;
}

/** 이전/다음 개최일 이동 내비 — 순수 날짜 수학이라 API 호출 없음 */
export function DateNav({ section, track, date }: Props) {
  const prev = prevRaceDay(track, date);
  const next = nextRaceDay(track, date);
  return (
    <nav aria-label="개최일 이동" className="flex items-center gap-3 text-sm">
      <Link
        href={`/${section}/${track.slug}/${prev}`}
        rel="prev"
        className="rounded px-2 py-1 hover:bg-foreground/5"
      >
        ← {formatKo(prev)}
      </Link>
      <time dateTime={toIsoDate(date)} className="font-semibold">
        {formatKo(date)}
      </time>
      <Link
        href={`/${section}/${track.slug}/${next}`}
        rel="next"
        className="rounded px-2 py-1 hover:bg-foreground/5"
      >
        {formatKo(next)} →
      </Link>
    </nav>
  );
}
