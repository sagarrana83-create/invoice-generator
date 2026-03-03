import "server-only";

import nodemailer from "nodemailer";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";

type SendInvoiceEmailParams = {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
};

function getTransporter() {
  const { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } = getEnv();

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new AppError("Email delivery is not configured.", "SMTP_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendInvoiceEmail({ to, invoiceNumber, pdfBuffer }: SendInvoiceEmailParams) {
  const { SMTP_FROM, SMTP_USER } = getEnv();
  const fromEmail = SMTP_FROM ?? SMTP_USER;

  if (!fromEmail) {
    throw new AppError("Email sender is not configured.", "SMTP_FROM_MISSING");
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
