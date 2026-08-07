import type { ItineraryStopPoint } from "./types";
import { stopPointDurationMinutes } from "./stop-point";

export type DayTimelineEntry =
  | {
      type: "stop";
      point: ItineraryStopPoint;
      arrivalMinutes: number;
      departureMinutes: number;
      durationMinutes: number;
      isDurationOverridden: boolean;
    }
  | { type: "travel"; minutes: number; meters: number }
  | { type: "lunch"; startMinutes: number; minutes: number };

export const LUNCH_DURATION_MINUTES = 60;
export const LUNCH_THRESHOLD_MINUTES = 12 * 60;

export type LunchOptions = { enabled: boolean | null; startMinutes?: number; durationMinutes?: number };

export function buildDayTimeline(
  stops: ItineraryStopPoint[],
  legs: { minutes: number; meters: number }[],
  dayStartMinutes = 540,
  options?: { durationOverridesMinutes?: (number | null)[]; lunch?: LunchOptions }
): { entries: DayTimelineEntry[]; endMinutes: number } {
  const entries: DayTimelineEntry[] = [];
  let cursor = dayStartMinutes;
  let lunchInserted = false;

  const lunch = options?.lunch;
  const shouldInsertLunch = lunch?.enabled === true;
  const lunchThresholdMinutes = lunch?.startMinutes ?? LUNCH_THRESHOLD_MINUTES;
  const lunchDurationMinutes = lunch?.durationMinutes ?? LUNCH_DURATION_MINUTES;

  function maybeInsertLunch() {
    if (!shouldInsertLunch || lunchInserted || cursor < lunchThresholdMinutes) {
      return;
    }
    entries.push({ type: "lunch", startMinutes: cursor, minutes: lunchDurationMinutes });
    cursor += lunchDurationMinutes;
    lunchInserted = true;
  }

  stops.forEach((point, index) => {
    const overrideMinutes = options?.durationOverridesMinutes?.[index] ?? null;
    const durationMinutes = overrideMinutes ?? stopPointDurationMinutes(point);
    const arrivalMinutes = cursor;
    const departureMinutes = arrivalMinutes + durationMinutes;
    entries.push({
      type: "stop",
      point,
      arrivalMinutes,
      departureMinutes,
      durationMinutes,
      isDurationOverridden: overrideMinutes != null
    });
    cursor = departureMinutes;
    maybeInsertLunch();

    if (index < stops.length - 1) {
      const leg = legs[index] ?? { minutes: 0, meters: 0 };
      entries.push({ type: "travel", minutes: leg.minutes, meters: leg.meters });
      cursor += leg.minutes;
      maybeInsertLunch();
    }
  });

  return { entries, endMinutes: cursor };
}

export function formatMinutesAsTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function minutesToTimeInputValue(minutes: number): string {
  return formatMinutesAsTime(minutes);
}

export function timeInputValueToMinutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function formatDurationLabel(minutes: number, hoursShort: string, minutesShort: string): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} ${minutesShort}`;
  if (mins === 0) return `${hours} ${hoursShort}`;
  return `${hours} ${hoursShort} ${mins} ${minutesShort}`;
}
