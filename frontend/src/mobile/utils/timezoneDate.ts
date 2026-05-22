/** YYYY-MM-DD in the given IANA timezone (matches backend local_date keys). */
export function localDateKeyInTimezone(timezone: string, reference = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

/** Calendar grid anchor: year/month/day as the user would see in their account timezone. */
export function calendarDateInTimezone(timezone: string, reference = new Date()): Date {
  const key = localDateKeyInTimezone(timezone, reference);
  const [year, month, day] = key.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
}
