import { DashboardShell } from "@/components/dashboard-shell";
import { InvoiceForm } from "@/components/invoice-form";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.userId }, include: { client: true, items: true } });
  if (!invoice) redirect("/invoices");

  return (
    <DashboardShell email={user.email}>
      <h1 className="mb-4 text-2xl font-semibold">Edit Invoice {invoice.invoiceNumber}</h1>
      <InvoiceForm
        initial={{
          id: invoice.id,
          companyName: invoice.companyName,
          companyLogo: invoice.companyLogo,
          companyAddress: invoice.companyAddress,
          companyEmail: invoice.companyEmail,
          companyPhone: invoice.companyPhone,
          taxId: invoice.taxId || "",
          client: { name: invoice.client.name, email: invoice.client.email, address: invoice.client.address },
          invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
          status: invoice.status,
          taxPercent: invoice.taxPercent,
          discount: invoice.discount,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
          items: invoice.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, price: i.price }))
        }}
      />
    </DashboardShell>
  );
}
