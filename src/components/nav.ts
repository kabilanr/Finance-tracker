export type NavItem = { href: string; label: string; ready: boolean };

// `ready` flips to true as each module ships.
export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", ready: true },
  { href: "/transactions", label: "Transactions", ready: true },
  { href: "/categories", label: "Categories", ready: false },
  { href: "/accounts", label: "Accounts", ready: false },
  { href: "/budgets", label: "Budgets", ready: false },
  { href: "/recurring", label: "Recurring", ready: false },
  { href: "/export", label: "Export", ready: false },
];
