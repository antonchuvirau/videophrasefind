import { type Metadata } from "next";

import ContactForm from "@/app/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact form is here to help you resolve your questions",
};

export default function Contact() {
  return (
    <div className="flex w-full max-w-[550px] flex-col gap-7 rounded-[32px] bg-[#0B111A] px-8 py-10 md:px-10">
      <h2 className="text-center text-2xl font-medium">
        What can we help you with?
      </h2>
      <ContactForm />
    </div>
  );
}
