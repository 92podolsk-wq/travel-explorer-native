function formatUtcHourInTimeZone(utcHour: number, timeZoneOffsetHours: number): string {
  const totalMinutes = Math.round((utcHour + timeZoneOffsetHours) * 60);
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getLocalTimeNow(date: Date, timeZoneOffsetHours: number): string {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  return formatUtcHourInTimeZone(utcHour, timeZoneOffsetHours);
}
