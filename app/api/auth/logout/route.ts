import { clearSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}
