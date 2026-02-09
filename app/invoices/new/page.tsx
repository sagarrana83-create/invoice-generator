import { DashboardShell } from "@/components/dashboard-shell";
import { InvoiceForm } from "@/components/invoice-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewInvoicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell email={user.email}>
      <h1 className="mb-4 text-2xl font-semibold">Create Invoice</h1>
      <InvoiceForm />
    </DashboardShell>
  );
}
