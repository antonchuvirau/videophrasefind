"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { Icons } from "@/components/Icons";

import { cn } from "@/lib/utils";

const defaultTabs = ["/", "/about", "/help", "/contact"] as const;

const capitalize = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
};

const tabText = (tab: (typeof defaultTabs)[number]) => {
  switch (tab) {
    case "/":
      return "Home";
    default:
      return capitalize(tab.slice(1));
  }
};

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-center bg-[#101824] px-7 py-4">
      <div className="flex w-full max-w-[calc(theme(screens.2xl)-2*theme(padding.7))] items-center justify-between max-[580px]:flex-col max-[580px]:gap-4">
        <Link href="/" className="text-2xl font-extrabold">
          <span>VideoPhrase</span>
          <span className="text-purple-600">Find</span>
        </Link>
        <nav className="flex items-center gap-8">
          <SignedIn>
            <Link
              href="/videos"
              className={cn(
                "min-w-[63px] text-center font-medium transition-colors hover:text-neutral-300",
                {
                  "font-bold": pathname === "/videos",
                },
              )}
            >
              Videos
            </Link>
          </SignedIn>
          <ul className="flex gap-8">
            {defaultTabs.map((tab) => (
              <Link
                key={tab}
                href={tab}
                className={cn(
                  "font-medium transition-colors hover:text-neutral-300",
                  {
                    "font-bold": tab === pathname,
                  },
                )}
              >
                <li className="min-w-[63px] text-center">{tabText(tab)}</li>
              </Link>
            ))}
          </ul>
          <div className="flex w-[63px] justify-center">
            <ClerkLoading>
              <Icons.spinner className="size-6 animate-spin text-[#9DA3AE]" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className={cn(
                    "text-center font-medium transition-colors hover:text-neutral-300",
                    {
                      "font-bold":
                        pathname ===
                          process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ||
                        pathname === process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
                    },
                  )}
                >
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </ClerkLoaded>
          </div>
        </nav>
      </div>
    </header>
  );
};

export { Header };
