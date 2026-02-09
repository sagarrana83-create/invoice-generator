import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InvoiceItemInput = {
  quantity: number;
  price: number;
};

type InvoiceReader = Prisma.TransactionClient | typeof prisma;

export function calculateTotals(items: InvoiceItemInput[], taxPercent: number, discount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount - discount;

  return {
    subtotal,
    taxAmount,
    total: Math.max(total, 0)
  };
}

function extractSequence(invoiceNumber: string) {
  const match = invoiceNumber.match(/INV-(\d+)/);
  return match ? Number(match[1]) : 0;
}

export async function generateInvoiceNumber(userId: string, db: InvoiceReader = prisma) {
  const latest = await db.invoice.findFirst({
    where: { userId },
    select: { invoiceNumber: true },
    orderBy: { createdAt: "desc" }
  });

  const next = extractSequence(latest?.invoiceNumber ?? "") + 1;
  return `INV-${String(next).padStart(4, "0")}`;
}
