import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export interface Crumb {
  name: string;
  /** 마지막 항목은 생략 가능(현재 페이지) */
  href?: string;
}

/** 시각적 브레드크럼 + BreadcrumbList JSON-LD */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="현재 위치" className="text-sm text-foreground/60">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">›</span>}
              {item.href ? (
                <Link href={item.href} className="hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
          })),
        }}
      />
    </>
  );
}
