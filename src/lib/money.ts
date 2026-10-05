const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function formatMoney(amount: number | string) {
  return inr.format(Number(amount));
}
