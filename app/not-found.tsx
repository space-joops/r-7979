import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-foreground/70">
        주소가 잘못되었거나, 해당 날짜에 경마가 열리지 않았을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 font-medium text-background"
      >
        홈으로 가기
      </Link>
    </main>
  );
}
