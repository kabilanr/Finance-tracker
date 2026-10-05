// Dates are stored as plain YYYY-MM-DD strings, so these helpers avoid
// timezone shifts by never round-tripping through local Date objects.

export function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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
