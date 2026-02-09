import Link from "next/link";
import { Header } from "@/components/header";

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header email={email} />
      <nav className="mx-auto flex max-w-7xl gap-4 px-6 py-4 text-sm">
        <Link href="/dashboard" className="rounded-lg border px-3 py-1.5">Dashboard</Link>
        <Link href="/invoices" className="rounded-lg border px-3 py-1.5">Invoices</Link>
        <Link href="/invoices/new" className="rounded-lg bg-brand px-3 py-1.5 text-white">Create Invoice</Link>
      </nav>
      <main className="mx-auto max-w-7xl px-6 pb-10">{children}</main>
    </div>
  );
}
