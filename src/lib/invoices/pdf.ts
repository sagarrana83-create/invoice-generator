import "server-only";

import PDFDocument from "pdfkit";

type InvoiceWithRelations = {
  invoiceNo: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  notes: string | null;
  taxRate: unknown;
  subtotal: unknown;
  taxAmount: unknown;
  totalAmount: unknown;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: Array<{
    description: string;
    quantity: unknown;
    unitPrice: unknown;
    lineTotal: unknown;
  }>;
};

type CompanyData = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
} | null;

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

const asText = (value: string | null | undefined) => value?.trim() || "—";

export async function generateInvoicePdfBuffer(
  invoice: InvoiceWithRelations,
  company: CompanyData,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Uint8Array[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", { align: "left" });
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica").text(`Invoice #: ${invoice.invoiceNo}`);
  doc.text(`Issue Date: ${new Intl.DateTimeFormat("en-US").format(invoice.issueDate)}`);
  doc.text(`Due Date: ${new Intl.DateTimeFormat("en-US").format(invoice.dueDate)}`);
  doc.text(`Status: ${invoice.status.toUpperCase()}`);

  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").text("From");
  doc.fontSize(10).font("Helvetica").text(asText(company?.name));
  doc.text(asText(company?.email));
  doc.text(asText(company?.phone));
  doc.text(asText(company?.address));

  doc.moveDown(0.7);
  doc.fontSize(12).font("Helvetica-Bold").text("Bill To");
  doc.fontSize(10).font("Helvetica").text(asText(invoice.client.name));
  doc.text(asText(invoice.client.email));
  doc.text(asText(invoice.client.phone));
  doc.text(asText(invoice.client.address));

  doc.moveDown(1.2);
  doc.font("Helvetica-Bold").text("Description", 50, doc.y);
  doc.text("Qty", 300, doc.y - 12);
  doc.text("Price", 360, doc.y - 12);
  doc.text("Total", 460, doc.y - 12);
  doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).stroke("#D1D5DB");
  doc.moveDown(0.7);

  doc.font("Helvetica");
  for (const item of invoice.items) {
    const y = doc.y;
    doc.text(item.description, 50, y, { width: 230 });
    doc.text(Number(item.quantity).toFixed(2), 300, y);
    doc.text(currency(item.unitPrice), 360, y);
    doc.text(currency(item.lineTotal), 460, y);
    doc.moveDown(0.8);
  }

  doc.moveDown(1);
  doc.moveTo(330, doc.y).lineTo(545, doc.y).stroke("#D1D5DB");
  doc.moveDown(0.5);

  doc.font("Helvetica").text("Subtotal", 360, doc.y);
  doc.text(currency(invoice.subtotal), 460, doc.y - 12);

  doc.text(`Tax (${Number(invoice.taxRate).toFixed(2)}%)`, 360, doc.y + 6);
  doc.text(currency(invoice.taxAmount), 460, doc.y - 12);

  doc.font("Helvetica-Bold").text("Total", 360, doc.y + 8);
  doc.text(currency(invoice.totalAmount), 460, doc.y - 12);

  if (invoice.notes) {
    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("Notes");
    doc.font("Helvetica").text(invoice.notes);
  }

  doc.end();
  return done;
}
