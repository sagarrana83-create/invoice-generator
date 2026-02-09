import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validations";
import { calculateTotals, generateInvoiceNumber } from "@/lib/invoice";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const parsed = invoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const totals = calculateTotals(parsed.data.items, parsed.data.taxPercent, parsed.data.discount);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const client = await tx.client.upsert({
          where: {
            userId_email: {
              userId: user.userId,
              email: parsed.data.client.email
            }
          },
          update: { name: parsed.data.client.name, address: parsed.data.client.address },
          create: { userId: user.userId, ...parsed.data.client }
        });

        const invoiceNumber = await generateInvoiceNumber(user.userId, tx);

        return tx.invoice.create({
          data: {
            userId: user.userId,
            clientId: client.id,
            invoiceNumber,
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
              create: parsed.data.items.map((item) => ({
                ...item,
                total: item.quantity * item.price
              }))
            }
          }
        });
      });

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      return NextResponse.json({ error: "Unable to create invoice" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unable to generate unique invoice number" }, { status: 409 });
}
