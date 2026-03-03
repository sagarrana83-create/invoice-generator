import Link from "next/link";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/auth/user";
import { formatCurrency } from "@/lib/invoices/calculations";
import { invoiceStatusBadgeStyles, markOverdueInvoicesForUser } from "@/lib/invoices/status";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

type InvoicesPageProps = {
  searchParams: {
    q?: string;
    status?: "all" | "draft" | "sent" | "paid" | "overdue";
    sort?: "newest" | "oldest";
    page?: string;
  };
};

function buildPageUrl(current: InvoicesPageProps["searchParams"], nextPage: number) {
  const params = new URLSearchParams();

  if (current.q) params.set("q", current.q);
  if (current.status && current.status !== "all") params.set("status", current.status);
  if (current.sort && current.sort !== "newest") params.set("sort", current.sort);
  params.set("page", `${nextPage}`);

  return `/dashboard/invoices?${params.toString()}`;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const userId = await requireUserId();
  await markOverdueInvoicesForUser(userId);

  const search = searchParams.q?.trim() ?? "";
  const status = searchParams.status ?? "all";
  const sort = searchParams.sort ?? "newest";
  const page = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const where: Prisma.InvoiceWhereInput = {
    userId,
    ...(status !== "all" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: "insensitive" } },
            { client: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [totalCount, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        issueDate: true,
        totalAmount: true,
        client: { select: { name: true } },
      },
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <form className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Search</label>
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Invoice # or client name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Status</label>
            <select name="status" defaultValue={status} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Sort</label>
            <select name="sort" defaultValue={sort} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Apply filters
            </button>
            <Link href="/dashboard/invoices" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>

        <Link href="/dashboard/invoices/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
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
              <th className="px-4 py-3 text-right font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoiceNo}</td>
                <td className="px-4 py-3 text-slate-700">{invoice.client.name}</td>
                <td className="px-4 py-3 text-slate-700">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${invoiceStatusBadgeStyles[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{new Intl.DateTimeFormat("en-US").format(invoice.issueDate)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(Number(invoice.totalAmount))}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-500">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                  No invoices match your filters yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-600">Page {currentPage} of {totalPages}</p>
        <div className="flex gap-2">
          <Link
            href={buildPageUrl(searchParams, Math.max(1, currentPage - 1))}
            className={`rounded-lg border px-3 py-1.5 ${currentPage <= 1 ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
          >
            Previous
          </Link>
          <Link
            href={buildPageUrl(searchParams, Math.min(totalPages, currentPage + 1))}
            className={`rounded-lg border px-3 py-1.5 ${currentPage >= totalPages ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  );
}
