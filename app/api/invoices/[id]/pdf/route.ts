import PDFDocument from "pdfkit";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: user.userId }, include: { client: true, items: true } });
  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(24).text(invoice.companyName, { align: "left" });
  doc.fontSize(11).text(invoice.companyAddress).text(invoice.companyEmail).text(invoice.companyPhone);
  doc.moveDown();
  doc.fontSize(18).text(`Invoice ${invoice.invoiceNumber}`, { align: "right" });
  doc.fontSize(11).text(`Date: ${invoice.invoiceDate.toDateString()}`, { align: "right" }).text(`Due: ${invoice.dueDate.toDateString()}`, { align: "right" });

  doc.moveDown();
  doc.fontSize(12).text("Bill To:", { underline: true });
  doc.text(invoice.client.name).text(invoice.client.email).text(invoice.client.address);

  doc.moveDown();
  doc.fontSize(12).text("Items", { underline: true });
  invoice.items.forEach((item) => {
    doc.fontSize(11).text(`${item.name} (${item.description}) - ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`);
  });

  doc.moveDown();
  doc.fontSize(12).text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { align: "right" });
  doc.text(`Tax (${invoice.taxPercent}%): $${(invoice.subtotal * (invoice.taxPercent / 100)).toFixed(2)}`, { align: "right" });
  doc.text(`Discount: $${invoice.discount.toFixed(2)}`, { align: "right" });
  doc.fontSize(14).text(`Total: $${invoice.total.toFixed(2)}`, { align: "right" });

  if (invoice.notes) {
    doc.moveDown().fontSize(11).text(`Notes: ${invoice.notes}`);
  }
  if (invoice.terms) {
    doc.moveDown().fontSize(11).text(`Terms: ${invoice.terms}`);
  }

  doc.end();
  await new Promise((resolve) => doc.on("end", resolve));
  const pdf = Buffer.concat(chunks);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`
    }
  });
}
