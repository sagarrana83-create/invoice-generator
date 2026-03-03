import "server-only";

import Stripe from "stripe";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const { STRIPE_SECRET_KEY } = getEnv();

  if (!STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured.", "STRIPE_NOT_CONFIGURED");
  }

  stripeClient = new Stripe(STRIPE_SECRET_KEY);
  return stripeClient;
}

export function getAppBaseUrl(): string {
  const { APP_URL, NEXT_PUBLIC_APP_URL } = getEnv();
  return APP_URL ?? NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
