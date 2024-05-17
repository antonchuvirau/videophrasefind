"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(formData: FormData) {
  const { userId } = auth();

  const prices = await stripe.prices.list({
    lookup_keys: [formData.get("lookup_key") as string],
    expand: ["data.product"],
  });

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    client_reference_id: userId as string,
    mode: "subscription",
    success_url: `http://localhost:3000/about`,
    cancel_url: `http://localhost:3000/contact`,
    line_items: [
      {
        price: prices.data[0].id,
        quantity: 1,
      },
    ],
  });

  redirect(session.url as string);
}

export async function createPortalSession() {
  const customerId = process.env.TEST_CUSTOMER_ID!; // temporary / for testing

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: "http://localhost:3000",
  });

  redirect(portalSession.url);
}
