"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { authSchema } from "@/lib/auth/validators";

type AuthActionState = {
  error?: string;
};

function extractAuthValues(formData: FormData) {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

export async function signupAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = authSchema.safeParse(extractAuthValues(formData));

  if (!parsedInput.success) {
    return { error: parsedInput.error.errors[0]?.message ?? "Invalid input provided." };
  }

  const email = parsedInput.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return { error: "This email is already registered. Please log in." };
  }

  const passwordHash = await hashPassword(parsedInput.data.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = authSchema.safeParse(extractAuthValues(formData));

  if (!parsedInput.success) {
    return { error: "Invalid email or password." };
  }

  const email = parsedInput.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const isPasswordValid = await verifyPassword(parsedInput.data.password, user.passwordHash);

  if (!isPasswordValid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
