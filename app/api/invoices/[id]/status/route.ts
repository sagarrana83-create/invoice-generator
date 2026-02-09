import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = ["PAID", "PENDING", "OVERDUE"] as const;

type InvoiceStatus = (typeof statuses)[number];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const contentType = req.headers.get("content-type") || "";
  const nextStatus = contentType.includes("form")
    ? (await req.formData()).get("status")
    : (await req.json()).status;

  if (!nextStatus || !statuses.includes(nextStatus as InvoiceStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.invoice.updateMany({
    where: { id, userId: user.userId },
    data: { status: nextStatus as InvoiceStatus }
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (contentType.includes("form")) {
    return NextResponse.redirect(new URL("/invoices", req.url));
  }

  return NextResponse.json({ ok: true });
}
