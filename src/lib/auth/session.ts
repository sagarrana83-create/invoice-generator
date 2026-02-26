import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "invoice_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

type SessionTokenPayload = {
  sessionId: string;
  userId: string;
};

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const dbSession = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  const token = await new SignJWT({
    sessionId: dbSession.id,
    userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSessionSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionTokenPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const sessionId = payload.sessionId;
    const userId = payload.userId;

    if (typeof sessionId !== "string" || typeof userId !== "string") {
      return null;
    }

    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!dbSession || dbSession.userId !== userId || dbSession.expiresAt < new Date()) {
      return null;
    }

    return { sessionId: dbSession.id, userId: dbSession.userId };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionTokenPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function clearSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      const sessionId = payload.sessionId;

      if (typeof sessionId === "string") {
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
      }
    } catch {
      // no-op: invalid cookie should still be cleared
    }
  }

  cookies().delete(SESSION_COOKIE);
}
