"use server";

import { InvoiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/user";
import { sendInvoiceEmail } from "@/lib/email/invoice-email";
import { AppError, getErrorMessage, logServerError } from "@/lib/errors";
import { calculateInvoiceTotals } from "@/lib/invoices/calculations";
import { getOwnedInvoiceWithCompany } from "@/lib/invoices/invoice-data";
import { generateInvoicePdfBuffer } from "@/lib/invoices/pdf";
import { markOverdueInvoicesForUser } from "@/lib/invoices/status";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Client name is required.").max(120),
  email: z.string().trim().email("Please provide a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

const companySchema = z.object({
  name: z.string().trim().min(2, "Company name is required.").max(120),
  email: z.string().trim().email("Please provide a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

const itemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required.").max(300),
  quantity: z.number().positive("Quantity must be greater than 0."),
  unitPrice: z.number().nonnegative("Unit price cannot be negative."),
});

const invoiceSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required."),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(InvoiceStatus),
  items: z.array(itemSchema).min(1, "At least one invoice item is required."),
});

export async function createClientAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message ?? "Invalid client data.");
  }

  await prisma.client.create({
    data: {
      userId,
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/invoices/new");
  redirect("/dashboard/clients");
}

export async function upsertCompanyAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message ?? "Invalid company data.");
  }

  await prisma.company.upsert({
    where: { userId },
    update: {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
    create: {
      userId,
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });

  revalidatePath("/dashboard/settings/company");
  redirect("/dashboard/settings/company");
}

function createInvoiceNumber(index: number): string {
  const padded = `${index}`.padStart(5, "0");
  return `INV-${padded}`;
}

export async function createInvoiceAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const rawItems = formData.get("items");
  let items: unknown = [];
  try {
    items = typeof rawItems === "string" ? JSON.parse(rawItems) : [];
  } catch {
    throw new AppError("Invalid invoice items payload.");
  }

  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    taxRate: formData.get("taxRate"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    items,
  });

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message ?? "Invalid invoice data.");
  }

  const client = await prisma.client.findFirst({
    where: {
      id: parsed.data.clientId,
      userId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new AppError("Selected client was not found.");
  }

  const totals = calculateInvoiceTotals(parsed.data.items, parsed.data.taxRate);
  const invoiceCount = await prisma.invoice.count({ where: { userId } });
  const invoiceNo = createInvoiceNumber(invoiceCount + 1);

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientId: parsed.data.clientId,
      invoiceNo,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: new Date(parsed.data.dueDate),
      notes: parsed.data.notes || null,
      taxRate: parsed.data.taxRate.toFixed(2),
      subtotal: totals.subtotal.toFixed(2),
      taxAmount: totals.taxAmount.toFixed(2),
      totalAmount: totals.totalAmount.toFixed(2),
      status: parsed.data.status,
      items: {
        createMany: {
          data: totals.normalizedItems.map((item) => ({
            description: item.description,
            quantity: item.quantity.toFixed(2),
            unitPrice: item.unitPrice.toFixed(2),
            lineTotal: item.lineTotal.toFixed(2),
          })),
        },
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function updateInvoiceStatusAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const invoiceId = formData.get("invoiceId");
  const status = formData.get("status");

  if (typeof invoiceId !== "string" || !invoiceId) {
    throw new AppError("Invoice id is required.");
  }

  if (status !== InvoiceStatus.draft && status !== InvoiceStatus.sent && status !== InvoiceStatus.paid) {
    throw new AppError("Invalid status.");
  }

  await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      userId,
    },
    data: { status },
  });

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function downloadInvoicePdfAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const invoiceId = formData.get("invoiceId");

  if (typeof invoiceId !== "string" || !invoiceId) {
    throw new AppError("Invoice id is required.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: { id: true },
  });

  if (!invoice) {
    throw new AppError("Invoice not found.");
  }

  redirect(`/dashboard/invoices/${invoiceId}/pdf`);
}

export async function sendInvoiceAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const invoiceId = formData.get("invoiceId");

  if (typeof invoiceId !== "string" || !invoiceId) {
    throw new AppError("Invoice id is required.");
  }

  const { invoice, company } = await getOwnedInvoiceWithCompany(userId, invoiceId);

  if (!invoice) {
    throw new AppError("Invoice not found.");
  }

  if (!invoice.client.email) {
    redirect(`/dashboard/invoices/${invoiceId}?error=${encodeURIComponent("Client email is missing.")}`);
  }

  try {
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, company);

    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNo,
      pdfBuffer,
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.sent },
    });

    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath("/dashboard/invoices");
    redirect(`/dashboard/invoices/${invoiceId}?success=${encodeURIComponent("Invoice emailed successfully.")}`);
  } catch (error) {
    logServerError("send-invoice", error);
    const message = getErrorMessage(error, "We could not send this invoice email right now.");
    redirect(`/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(message)}`);
  }
}

export async function createStripeCheckoutSessionAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  await markOverdueInvoicesForUser(userId);

  const invoiceId = formData.get("invoiceId");

  if (typeof invoiceId !== "string" || !invoiceId) {
    throw new AppError("Invoice id is required.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
      paymentId: null,
      status: {
        in: [InvoiceStatus.draft, InvoiceStatus.sent],
      },
    },
    select: {
      id: true,
      invoiceNo: true,
      totalAmount: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!invoice) {
    throw new AppError("Invoice is unavailable for payment.");
  }

  const amountInCents = Math.round(Number(invoice.totalAmount) * 100);

  if (amountInCents <= 0) {
    throw new AppError("Invoice total must be greater than zero.");
  }

  try {
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: `${baseUrl}/dashboard/invoices/${invoice.id}?payment=success`,
        cancel_url: `${baseUrl}/dashboard/invoices/${invoice.id}?payment=cancelled`,
        metadata: {
          invoiceId: invoice.id,
          userId,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountInCents,
              product_data: {
                name: `Payment for ${invoice.invoiceNo}`,
              },
            },
          },
        ],
      },
      { idempotencyKey: `invoice-${invoice.id}-${invoice.updatedAt.getTime()}` },
    );

    if (!session.url) {
      throw new AppError("Unable to create Stripe checkout session.");
    }

    redirect(session.url);
  } catch (error) {
    logServerError("create-stripe-session", error);
    const message = getErrorMessage(error, "Unable to start payment. Please try again.");
    redirect(`/dashboard/invoices/${invoice.id}?error=${encodeURIComponent(message)}`);
  }
}
