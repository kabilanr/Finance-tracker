// Dates are stored as plain YYYY-MM-DD strings, so these helpers avoid
// timezone shifts by never round-tripping through local Date objects.

// "Today" in the app's time zone (India by default), so entries dated today and
// recurring items due today line up with the user's calendar, not the server's.
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Kolkata";

export function today() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentMonth() {
  return today().slice(0, 7);
}

export function isMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start: `${month}-01`, end: `${next}-01` };
}

// Month names are spelled out here rather than via toLocaleDateString, whose
// output differs between Node and browsers (e.g. "Sep" vs "Sept").
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatMonthShort(month: string, withYear = false) {
  const [y, m] = month.split("-").map(Number);
  const name = MONTHS[m - 1].slice(0, 3);
  return withYear ? `${name} ${String(y).slice(2)}` : name;
}

export function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// The k-th occurrence (k = 0 is the start date) of a weekly, monthly or
// yearly schedule. Monthly and yearly keep the start's day of month, using the
// last day of shorter months (a schedule starting on the 31st lands on 30 Apr).
export function occurrenceDate(start: string, frequency: "weekly" | "monthly" | "yearly", k: number) {
  const [y, m, d] = start.split("-").map(Number);
  if (frequency === "weekly") {
    return new Date(Date.UTC(y, m - 1, d + 7 * k)).toISOString().slice(0, 10);
  }
  const monthsAhead = frequency === "monthly" ? k : 12 * k;
  const total = m - 1 + monthsAhead;
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  const day = Math.min(d, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
