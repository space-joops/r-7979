import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-foreground/10 text-sm text-foreground/60">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <nav aria-label="푸터 메뉴" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/racecard" className="hover:text-foreground">출마표</Link>
          <Link href="/results" className="hover:text-foreground">경주결과</Link>
          <Link href="/odds" className="hover:text-foreground">확정 배당률</Link>
          <Link href="/predict" className="hover:text-foreground">예측</Link>
        </nav>
        <div className="space-y-1">
          <p>경마 개최: 서울 토·일 / 부산경남 금·일 / 제주 금·토 (명절 주간 등은 변동될 수 있습니다)</p>
          <p>
            데이터 출처: 한국마사회 공공데이터 (
            <a
              href="https://www.data.go.kr"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              data.go.kr
            </a>
            ). 정보 제공 목적이며 실제 발매 정보와 다를 수 있습니다.
          </p>
          <p>© {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
