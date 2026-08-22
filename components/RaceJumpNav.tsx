import Link from "next/link";

export interface RaceJumpItem {
  raceNo: number;
  /** "12:55" 등. 없으면 번호만 */
  time?: string;
}

/**
 * 경주 점프 바 — 전광판처럼 경주 번호 칩을 가로로 늘어놓아
 * 긴 페이지에서 원하는 경주로 바로 이동한다.
 */
export function RaceJumpNav({ races }: { races: RaceJumpItem[] }) {
  if (races.length < 2) return null;
  return (
    <nav aria-label="경주 바로가기" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-1.5 py-1">
        {races.map((race) => (
          <li key={race.raceNo}>
            <Link
              href={`#race-${race.raceNo}`}
              className="flex flex-col items-center rounded-md border border-foreground/15 px-2.5 py-1 leading-tight hover:border-accent hover:text-accent"
            >
              <span className="text-sm font-bold tabular-nums">
                {race.raceNo}R
              </span>
              {race.time && (
                <span className="text-[11px] text-foreground/60 tabular-nums">
                  {race.time}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
