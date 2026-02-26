import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function requireUserId(): Promise<string> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session.userId;
}
