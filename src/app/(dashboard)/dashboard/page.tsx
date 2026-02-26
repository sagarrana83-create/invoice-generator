import Link from "next/link";

export default function DashboardPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Invoice operations center</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Manage your clients, create invoices with line items, and track payment status in one
        authenticated workspace.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create invoice
        </Link>
        <Link
          href="/dashboard/clients"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Manage clients
        </Link>
      </div>
    </section>
  );
}
