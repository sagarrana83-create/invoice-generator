import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency, dateFormat } from "@/lib/utils";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ query?: string; status?: string; date?: string }>;

function dateRange(input?: string) {
  if (!input) return undefined;
  const base = new Date(input);
  if (Number.isNaN(base.valueOf())) return undefined;

  return {
    gte: new Date(input),
    lte: new Date(`${input}T23:59:59`)
  };
}

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.userId,
      status:
        params.status && params.status !== "ALL"
          ? (params.status as "PAID" | "PENDING" | "OVERDUE")
          : undefined,
      invoiceDate: dateRange(params.date),
      client: params.query
        ? {
            name: {
              contains: params.query.trim()
            }
          }
        : undefined
    },
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <DashboardShell email={user.email}>
      <section className="card mb-4">
        <form className="grid gap-2 md:grid-cols-4">
          <input
            name="query"
            defaultValue={params.query}
            placeholder="Search client"
            className="rounded-lg border px-3 py-2"
          />
          <select name="status" defaultValue={params.status || "ALL"} className="rounded-lg border px-3 py-2">
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <input type="date" name="date" defaultValue={params.date} className="rounded-lg border px-3 py-2" />
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-white">
            Apply
          </button>
        </form>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Invoice</th>
              <th className="p-2">Client</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Total</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="p-2">{invoice.invoiceNumber}</td>
                  <td className="p-2">{invoice.client.name}</td>
                  <td className="p-2">{dateFormat(invoice.invoiceDate)}</td>
                  <td className="p-2">{invoice.status}</td>
                  <td className="p-2">{currency(invoice.total)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/invoices/${invoice.id}/edit`} className="rounded border px-2 py-1">
                        Edit
                      </Link>
                      <form action={`/api/invoices/${invoice.id}`} method="post">
                        <input type="hidden" name="_method" value="delete" />
                        <button type="submit" className="rounded border px-2 py-1 text-red-500">
                          Delete
                        </button>
                      </form>
                      <form action={`/api/invoices/${invoice.id}/status`} method="post">
                        <input type="hidden" name="status" value={invoice.status === "PAID" ? "PENDING" : "PAID"} />
                        <button type="submit" className="rounded border px-2 py-1">
                          Mark {invoice.status === "PAID" ? "Pending" : "Paid"}
                        </button>
                      </form>
                      <a href={`/api/invoices/${invoice.id}/pdf`} className="rounded border px-2 py-1">
                        Download PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  No invoices found. Create your first invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
