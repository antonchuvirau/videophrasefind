import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

import QueryProvider from "@/app/utils/queryProvider";

import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s - VideoPhraseFind",
    default: "VideoPhraseFind",
  },
  description: "Search for text spoken in your video.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-[#161E2A]`}
      >
        <Analytics />
        <QueryProvider>
          <Header />
          <main className="flex flex-1 bg-[#161E2A] px-3 py-7 sm:px-7">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
