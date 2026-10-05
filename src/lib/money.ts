// Formatted by hand rather than with Intl so server and browser always agree:
// their ICU data differs (e.g. compact "25T" vs "25K"), which breaks hydration.

function groupIndian(whole: string) {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

export function formatMoney(amount: number | string) {
  const n = Number(amount);
  const [whole, fraction] = Math.abs(n).toFixed(2).split(".");
  return `${n < 0 ? "-" : ""}₹${groupIndian(whole)}.${fraction}`;
}

// Short axis labels: 950, 25k, 1.5L, 2Cr.
export function formatCompact(amount: number) {
  const trim = (v: number) => String(Number(v.toFixed(1)));
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}${trim(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}${trim(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}${trim(abs / 1e3)}k`;
  return `${sign}${trim(abs)}`;
}
