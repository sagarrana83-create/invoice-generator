import Link from "next/link";

const navItems = [{ href: "/dashboard", label: "Dashboard" }];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Invoice SaaS</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">Workspace</p>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
