import "server-only";

import { runOverdueSweep } from "@/lib/invoices/status";

export async function runOverdueInvoiceJob() {
  const updatedCount = await runOverdueSweep();
  return { updatedCount, ranAt: new Date().toISOString() };
}
