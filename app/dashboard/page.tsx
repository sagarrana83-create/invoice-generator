import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [total, paid, pending, revenue] = await Promise.all([
    prisma.invoice.count({ where: { userId: user.userId } }),
    prisma.invoice.count({ where: { userId: user.userId, status: "PAID" } }),
    prisma.invoice.count({ where: { userId: user.userId, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.invoice.aggregate({ where: { userId: user.userId, status: "PAID" }, _sum: { total: true } })
  ]);

  const cards = [
    { label: "Total invoices", value: total.toString() },
    { label: "Paid invoices", value: paid.toString() },
    { label: "Pending invoices", value: pending.toString() },
    { label: "Total revenue", value: currency(revenue._sum.total || 0) }
  ];

  return (
    <DashboardShell email={user.email}>
      <h1 className="mb-6 text-2xl font-bold">Dashboard Overview</h1>
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <article className="card" key={card.label}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
