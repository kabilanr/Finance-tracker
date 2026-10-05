// Quotes every cell and neutralises spreadsheet formulas: a cell starting with
// = + - @ (or a tab/CR) would otherwise run as a formula when opened in Excel.
function cell(value: string | number | null | undefined) {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]) {
  // A byte-order mark makes Excel read the file as UTF-8 (so ₹ and names survive).
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
