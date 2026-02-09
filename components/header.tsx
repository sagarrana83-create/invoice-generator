import Link from "next/link";
import { LogOut } from "lucide-react";

export function Header({ email }: { email: string }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold">InvoicePro</Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-300">{email}</span>
          <form action="/api/auth/logout" method="post">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" type="submit">
              <LogOut size={14} />
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
