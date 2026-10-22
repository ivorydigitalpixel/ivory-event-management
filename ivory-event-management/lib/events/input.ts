export const timeZones = ["Asia/Bangkok", "Asia/Singapore", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "UTC"];
export const eventTypes = ["wedding", "engagement", "corporate", "birthday", "other"];
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Convert wall-clock input using the EVENT zone, independent of the server/browser zone.
// Reject skipped and repeated DST times rather than silently scheduling the wrong hour.
export function localToUtc(local: string, zone: string): string {
  if (!timeZones.includes(zone) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error("date");
  const wall = Date.parse(local + ":00Z");
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) throw new Error("date");
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const wallAt = (instant: number) => {
    const p = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
  };
  const offsets = new Set([-36, 0, 36].map(hours => {
    const instant = wall + hours * 3600000;
    return wallAt(instant) - instant;
  }));
  const matches = [...offsets].map(offset => wall - offset).filter(instant => wallAt(instant) === wall);
  if (matches.length !== 1) throw new Error("date");
  return new Date(matches[0]).toISOString();
}

export function parseEvent(form: FormData) {
  const read = (key: string) => String(form.get(key) ?? "").trim();
  const name = read("name"), venue = read("venue"), notes = read("notes");
  const event_type = read("event_type"), time_zone = read("time_zone");
  if (!name || name.length > 120 || venue.length > 240 || notes.length > 4000 || !eventTypes.includes(event_type)) throw new Error("fields");
  const starts_at = localToUtc(read("starts_at"), time_zone);
  const ends_at = read("ends_at") ? localToUtc(read("ends_at"), time_zone) : null;
  if (ends_at && ends_at <= starts_at) throw new Error("end");
  return { name, venue: venue || null, notes: notes || null, event_type, time_zone, starts_at, ends_at };
}
