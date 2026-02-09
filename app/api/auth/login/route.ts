import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validations";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = authSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!matches) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signSession({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
