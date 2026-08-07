import type { SeasonWindows } from "@/entities/region/model/types";
import type { Season } from "@/entities/poi/model/types";

export type SeasonReminder = {
  season: Season;
  daysUntil: number;
};

function parseMonthDay(value: string, year: number): Date | null {
  const match = /^(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  return new Date(year, month - 1, day);
}

export function getUpcomingSeasonReminder(
  seasonWindows: SeasonWindows | null | undefined,
  now: Date = new Date(),
  daysAhead = 7
): SeasonReminder | null {
  if (!seasonWindows) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const season of Object.keys(seasonWindows) as Season[]) {
    const window = seasonWindows[season];
    if (!window) continue;

    const start = parseMonthDay(window.start, today.getFullYear());
    if (!start) continue;

    const diffDays = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= daysAhead) {
      return { season, daysUntil: diffDays };
    }
  }

  return null;
}
