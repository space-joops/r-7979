import Link from "next/link";
import { TRACKS, type TrackSlug } from "@/lib/kra/tracks";

interface Props {
  /** "racecard" | "odds" */
  section: string;
  current?: TrackSlug;
  /** 지정 시 트랙 링크가 해당 날짜로 이동 */
  date?: string;
}

export function TrackTabs({ section, current, date }: Props) {
  return (
    <nav aria-label="경마장 선택" className="flex gap-2">
      {TRACKS.map((track) => {
        const active = track.slug === current;
        return (
          <Link
            key={track.slug}
            href={`/${section}/${track.slug}${date ? `/${date}` : ""}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-background"
                : "bg-foreground/5 hover:bg-foreground/10"
            }`}
          >
            {track.nameKo}
          </Link>
        );
      })}
    </nav>
  );
}
