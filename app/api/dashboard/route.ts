import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [total, paid, pending, revenue] = await Promise.all([
    prisma.invoice.count({ where: { userId: user.userId } }),
    prisma.invoice.count({ where: { userId: user.userId, status: "PAID" } }),
    prisma.invoice.count({ where: { userId: user.userId, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.invoice.aggregate({ where: { userId: user.userId, status: "PAID" }, _sum: { total: true } })
  ]);

  return NextResponse.json({ total, paid, pending, revenue: revenue._sum.total || 0 });
}
