import type { Metadata } from "next";
import { Inter, Exo_2 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import ClerkProvider from "@/components/providers/clerkProvider";
import QueryProvider from "@/components/providers/queryProvider";

import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

const exo = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s - siftvid.io",
    default: "siftvid.io",
  },
  icons: {
    icon: "/favicon.ico",
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
      <ClerkProvider>
        <body
          className={`${inter.className} ${exo.variable} flex min-h-screen flex-col bg-[#161E2A]`}
        >
          <Analytics />
          <QueryProvider>
            <Header />
            <main className="flex flex-1 bg-[#161E2A] px-3 py-7 sm:px-7">
              {children}
            </main>
            <Footer />
            <Toaster />
          </QueryProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
