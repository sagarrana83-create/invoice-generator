import { InvoiceStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  downloadInvoicePdfAction,
  sendInvoiceAction,
  updateInvoiceStatusAction,
} from "@/app/(dashboard)/actions";
import { requireUserId } from "@/lib/auth/user";
import { formatCurrency } from "@/lib/invoices/calculations";
import { getOwnedInvoiceForUser } from "@/lib/invoices/invoice-data";

const statusBadgeStyles: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
};

export default async function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();

  const invoice = await getOwnedInvoiceForUser(userId, params.id);

  if (!invoice) {
    notFound();
  }

  const statuses: InvoiceStatus[] = [InvoiceStatus.draft, InvoiceStatus.sent, InvoiceStatus.paid];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Invoice</p>
            <h2 className="text-2xl font-semibold text-slate-900">{invoice.invoiceNo}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {invoice.client.name} • Due {new Intl.DateTimeFormat("en-US").format(invoice.dueDate)}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeStyles[invoice.status]}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <form action={downloadInvoicePdfAction}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Download PDF
                </button>
              </form>

              <form action={sendInvoiceAction}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Send Invoice
                </button>
              </form>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Set status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <form key={status} action={updateInvoiceStatusAction}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={invoice.status === status}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm capitalize text-slate-700 disabled:bg-slate-900 disabled:text-white"
                    >
                      {status}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Qty</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Unit Price</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-700">{item.description}</td>
                <td className="px-4 py-3 text-slate-700">{Number(item.quantity).toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(Number(item.unitPrice))}</td>
                <td className="px-4 py-3 text-slate-900">{formatCurrency(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(Number(invoice.subtotal))}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
          <span>Tax ({Number(invoice.taxRate).toFixed(2)}%)</span>
          <span>{formatCurrency(Number(invoice.taxAmount))}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(Number(invoice.totalAmount))}</span>
        </div>
      </div>
    </section>
  );
}
