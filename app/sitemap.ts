import type { MetadataRoute } from "next";
import { raceDates } from "@/lib/kra/schedule";
import { TRACKS } from "@/lib/kra/tracks";
import { addDays, parseYmd, todayKst } from "@/lib/kst";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

// 순수 날짜 수학만 사용 — API 호출 없음
export default function sitemap(): MetadataRoute.Sitemap {
  const today = todayKst();
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/racecard`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/odds`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...TRACKS.flatMap((t) => [
      { url: `${SITE_URL}/racecard/${t.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 },
      { url: `${SITE_URL}/odds/${t.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 },
    ]),
  ];

  const dated: MetadataRoute.Sitemap = TRACKS.flatMap((track) =>
    raceDates(track, addDays(today, -30), addDays(today, 7)).flatMap((date) => {
      const past = date < today;
      const lastModified = past ? parseYmd(date)! : now;
      return [
        {
          url: `${SITE_URL}/racecard/${track.slug}/${date}`,
          lastModified,
          changeFrequency: past ? ("monthly" as const) : ("hourly" as const),
          priority: past ? 0.4 : 0.8,
        },
        {
          url: `${SITE_URL}/odds/${track.slug}/${date}`,
          lastModified,
          changeFrequency: past ? ("monthly" as const) : ("hourly" as const),
          priority: past ? 0.4 : 0.7,
        },
      ];
    }),
  );

  return [...statics, ...dated];
}
