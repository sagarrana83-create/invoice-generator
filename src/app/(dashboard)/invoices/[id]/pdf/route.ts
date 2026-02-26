import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOwnedInvoiceWithCompany } from "@/lib/invoices/invoice-data";
import { generateInvoicePdfBuffer } from "@/lib/invoices/pdf";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { invoice, company } = await getOwnedInvoiceWithCompany(session.userId, params.id);

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const pdfBuffer = await generateInvoicePdfBuffer(invoice, company);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
