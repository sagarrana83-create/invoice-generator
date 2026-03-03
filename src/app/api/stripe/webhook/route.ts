import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripeSignature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSignature || !webhookSecret) {
    return NextResponse.json({ message: "Invalid webhook configuration" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret);
  } catch {
    return NextResponse.json({ message: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    const userId = session.metadata?.userId;

    if (invoiceId && userId) {
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.id;

      await prisma.invoice.updateMany({
        where: {
          id: invoiceId,
          userId,
          paymentId: null,
          status: {
            not: InvoiceStatus.paid,
          },
        },
        data: {
          status: InvoiceStatus.paid,
          paymentId: paymentIntentId,
          paymentDate: new Date(),
          paymentProvider: "stripe",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
