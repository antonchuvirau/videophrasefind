import { type Metadata } from "next";

import {
  createCheckoutSession,
  createPortalSession,
} from "@/app/stripe-actions";

import { CheckoutButton } from "@/app/pricing/checkout-button";

export const metadata: Metadata = {
  title: "Subscription",
};

const types = ["month", "year"] as const;

export default function Contact() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex gap-8">
        {types.map((type) => (
          <div
            key={type}
            className="flex min-w-[300px] flex-col gap-12 rounded-xl bg-[#0B111A] p-8"
          >
            <div className="flex flex-col gap-6 text-center">
              <h3 className="text-2xl font-bold">Pro plan</h3>
              <h5>{`$${type === "month" ? "7" : "80"}.00 / ${type}`}</h5>
            </div>
            <form action={createCheckoutSession}>
              <input type="hidden" name="lookup_key" value={`pro-${type}`} />
              <CheckoutButton />
            </form>
          </div>
        ))}
      </div>
      {true && (
        <form className="text-center font-bold" action={createPortalSession}>
          <button type="submit">
            <span className="underline">Manage your billing information</span>
          </button>
        </form>
      )}
    </section>
  );
}