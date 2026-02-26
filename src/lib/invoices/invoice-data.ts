import "server-only";

import { prisma } from "@/lib/prisma";

export async function getOwnedInvoiceForUser(userId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
    include: {
      client: true,
      items: true,
    },
  });
}

export async function getOwnedInvoiceWithCompany(userId: string, invoiceId: string) {
  const [invoice, company] = await Promise.all([
    getOwnedInvoiceForUser(userId, invoiceId),
    prisma.company.findUnique({ where: { userId } }),
  ]);

  return { invoice, company };
}
