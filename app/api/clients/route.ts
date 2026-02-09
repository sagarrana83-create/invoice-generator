import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const clients = await prisma.client.findMany({ where: { userId: user.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(clients);
}
