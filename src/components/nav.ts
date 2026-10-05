export type NavItem = { href: string; label: string; ready: boolean };

// `ready` flips to true as each module ships.
export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", ready: true },
  { href: "/transactions", label: "Transactions", ready: true },
  { href: "/categories", label: "Categories", ready: true },
  { href: "/accounts", label: "Accounts", ready: true },
  { href: "/budgets", label: "Budgets", ready: true },
  { href: "/recurring", label: "Recurring", ready: true },
  { href: "/export", label: "Export", ready: false },
];
