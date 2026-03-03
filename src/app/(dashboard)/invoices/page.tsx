import Link from "next/link";
import { requireUserId } from "@/lib/auth/user";
import { formatCurrency } from "@/lib/invoices/calculations";
import { invoiceStatusBadgeStyles, markOverdueInvoicesForUser } from "@/lib/invoices/status";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const userId = await requireUserId();
  await markOverdueInvoicesForUser(userId);

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      client: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-600">Manage all invoices for your workspace.</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Issue Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNo}</td>
                <td className="px-4 py-3 text-slate-700">{invoice.client.name}</td>
                <td className="px-4 py-3 text-slate-700">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${invoiceStatusBadgeStyles[invoice.status]}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {new Intl.DateTimeFormat("en-US").format(invoice.issueDate)}
                </td>
                <td className="px-4 py-3 text-slate-900">{formatCurrency(Number(invoice.totalAmount))}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-500">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No invoices yet. Create your first invoice.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
