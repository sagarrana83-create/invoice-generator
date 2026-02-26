import Link from "next/link";
import { createInvoiceAction } from "@/app/(dashboard)/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { requireUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";

export default async function NewInvoicePage() {
  const userId = await requireUserId();

  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">New invoice</h2>
          <p className="text-sm text-slate-600">Create an invoice with multiple line items.</p>
        </div>
        <Link href="/dashboard/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Back to invoices
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add a client before creating invoices. Go to <Link href="/dashboard/clients" className="underline">Clients</Link>.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <InvoiceForm clients={clients} action={createInvoiceAction} />
        </div>
      )}
    </section>
  );
}
