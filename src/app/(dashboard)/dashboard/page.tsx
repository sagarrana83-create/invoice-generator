import Link from "next/link";
import { InvoiceStatus } from "@prisma/client";
import { requireUserId } from "@/lib/auth/user";
import { formatCurrency } from "@/lib/invoices/calculations";
import { markOverdueInvoicesForUser } from "@/lib/invoices/status";
import { prisma } from "@/lib/prisma";

function buildMonthlyTrend(paidInvoices: Array<{ issueDate: Date; totalAmount: unknown }>) {
  const map = new Map<string, number>();

  for (const invoice of paidInvoices) {
    const key = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + Number(invoice.totalAmount));
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  await markOverdueInvoicesForUser(userId);

  const [metrics, recentInvoices, paidInvoices] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["status"],
      where: { userId },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        totalAmount: true,
        issueDate: true,
        client: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { userId, status: InvoiceStatus.paid },
      orderBy: { issueDate: "asc" },
      select: { issueDate: true, totalAmount: true },
    }),
  ]);

  const totalInvoicesCount = metrics.reduce((acc, item) => acc + item._count.id, 0);

  const totalRevenue = metrics
    .filter((item) => item.status === InvoiceStatus.paid)
    .reduce((acc, item) => acc + Number(item._sum.totalAmount ?? 0), 0);

  const pendingAmount = metrics
    .filter((item) => item.status === InvoiceStatus.draft || item.status === InvoiceStatus.sent)
    .reduce((acc, item) => acc + Number(item._sum.totalAmount ?? 0), 0);

  const overdueAmount = metrics
    .filter((item) => item.status === InvoiceStatus.overdue)
    .reduce((acc, item) => acc + Number(item._sum.totalAmount ?? 0), 0);

  const trend = buildMonthlyTrend(paidInvoices);
  const maxTrendValue = Math.max(...trend.map((point) => point.total), 1);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Business overview</h2>
        <p className="text-sm text-slate-600">Live invoice analytics for your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total revenue</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending amount</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{formatCurrency(pendingAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Overdue amount</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">{formatCurrency(overdueAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total invoices</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalInvoicesCount}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent invoices</h3>
            <Link href="/dashboard/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No invoices yet. Create your first invoice to see analytics.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-3 py-2">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{invoice.client.name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {new Intl.DateTimeFormat("en-US").format(invoice.issueDate)}
                      </td>
                      <td className="px-3 py-2 text-slate-900">{formatCurrency(Number(invoice.totalAmount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Revenue trend</h3>
          <p className="mt-1 text-xs text-slate-500">Paid invoice totals by month (last 6 months).</p>

          <div className="mt-4 space-y-3">
            {trend.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No paid invoices yet.
              </p>
            ) : (
              trend.map((point) => (
                <div key={point.month}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{point.month}</span>
                    <span>{formatCurrency(point.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${Math.max((point.total / maxTrendValue) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
