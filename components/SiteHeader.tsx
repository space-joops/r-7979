import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/racecard", label: "출마표" },
  { href: "/results", label: "경주결과" },
  { href: "/odds", label: "배당률" },
] as const;

/** 전역 헤더 — 검색으로 깊은 페이지에 착지한 사용자의 이동 경로 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="h-6 w-6 fill-none stroke-accent"
            strokeWidth="14"
            strokeLinecap="round"
          >
            <path d="M 26 82 C 18 68 16 52 22 40 C 28 27 38 20 50 20 C 62 20 72 27 78 40 C 84 52 82 68 74 82" />
          </svg>
          {SITE_NAME}
        </Link>
        <nav aria-label="주요 메뉴" className="flex gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 font-medium hover:bg-foreground/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
