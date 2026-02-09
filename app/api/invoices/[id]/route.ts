import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { invoiceSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { calculateTotals } from "@/lib/invoice";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const parsed = invoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.invoice.findFirst({ where: { id, userId: user.userId } });
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const totals = calculateTotals(parsed.data.items, parsed.data.taxPercent, parsed.data.discount);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: {
          userId_email: {
            userId: user.userId,
            email: parsed.data.client.email
          }
        },
        update: {
          name: parsed.data.client.name,
          address: parsed.data.client.address
        },
        create: {
          userId: user.userId,
          ...parsed.data.client
        }
      });

      return tx.invoice.update({
        where: { id },
        data: {
          clientId: client.id,
          invoiceDate: new Date(parsed.data.invoiceDate),
          dueDate: new Date(parsed.data.dueDate),
          status: parsed.data.status,
          companyName: parsed.data.companyName,
          companyLogo: parsed.data.companyLogo || null,
          companyAddress: parsed.data.companyAddress,
          companyEmail: parsed.data.companyEmail,
          companyPhone: parsed.data.companyPhone,
          taxId: parsed.data.taxId || null,
          notes: parsed.data.notes || null,
          terms: parsed.data.terms || null,
          taxPercent: parsed.data.taxPercent,
          discount: parsed.data.discount,
          subtotal: totals.subtotal,
          total: totals.total,
          items: {
            deleteMany: {},
            create: parsed.data.items.map((item) => ({
              ...item,
              total: item.quantity * item.price
            }))
          }
        }
      });
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unable to update invoice" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  await prisma.invoice.deleteMany({ where: { id, userId: user.userId } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const formData = await req.formData();
  const method = formData.get("_method");

  if (method === "delete") {
    await DELETE(req, context);
    return NextResponse.redirect(new URL("/invoices", req.url));
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
