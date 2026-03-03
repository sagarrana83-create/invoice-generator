import "server-only";

import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const invoiceStatusBadgeStyles: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-700",
};

const overdueWhere = {
  dueDate: {
    lt: new Date(),
  },
  status: {
    in: [InvoiceStatus.draft, InvoiceStatus.sent] as InvoiceStatus[],
  },
};

export async function markOverdueInvoicesForUser(userId: string): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      userId,
      ...overdueWhere,
    },
    data: {
      status: InvoiceStatus.overdue,
    },
  });

  return result.count;
}

export async function runOverdueSweep(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: overdueWhere,
    data: {
      status: InvoiceStatus.overdue,
    },
  });

  return result.count;
}
