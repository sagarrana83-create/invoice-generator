import "server-only";

import nodemailer from "nodemailer";

type SendInvoiceEmailParams = {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration is missing.");
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export async function sendInvoiceEmail({ to, invoiceNumber, pdfBuffer }: SendInvoiceEmailParams) {
  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  if (!fromEmail) {
    throw new Error("SMTP_FROM or SMTP_USER must be configured.");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject: `Invoice ${invoiceNumber}`,
    text: `Hi,\n\nPlease find your invoice ${invoiceNumber} attached.\n\nThank you.`,
    html: `<p>Hi,</p><p>Please find your invoice <strong>${invoiceNumber}</strong> attached.</p><p>Thank you.</p>`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
