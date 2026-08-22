/** 페이지 전환 중 표시되는 스켈레톤 — 표 중심 페이지의 형태를 흉내낸다 */
export function PageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="불러오는 중"
      className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-4 py-8"
    >
      <div className="h-4 w-48 rounded bg-foreground/10" />
      <div className="mt-4 h-8 w-72 rounded bg-foreground/10" />
      <div className="mt-6 flex gap-2">
        <div className="h-8 w-16 rounded-full bg-foreground/10" />
        <div className="h-8 w-16 rounded-full bg-foreground/10" />
        <div className="h-8 w-16 rounded-full bg-foreground/10" />
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-9 w-full rounded bg-foreground/5" />
        ))}
      </div>
    </main>
  );
}
