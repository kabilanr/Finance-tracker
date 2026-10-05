import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your income, expenses, budgets and accounts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col md:flex-row">
        <aside className="border-b border-slate-200 p-4 md:w-56 md:border-b-0 md:border-r dark:border-slate-800">
          <div className="mb-4 text-lg font-semibold text-emerald-600">Finance Tracker</div>
          <Sidebar />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
