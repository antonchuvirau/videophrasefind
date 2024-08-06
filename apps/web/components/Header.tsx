"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { getMembershipData } from "@/app/membership-actions";

import { Icons } from "@/components/Icons";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import _ from "lodash";

const leftTabs = ["/about", "/help", "/contact", "/pricing"] as const;

const tabText = (tab: (typeof leftTabs)[number]) => {
  return _.capitalize(tab.slice(1));
};

const Header = () => {
  const pathname = usePathname();

  const { userId } = useAuth();

  const membershipQuery = useQuery({
    enabled: !!userId,
    queryKey: ["credits", userId],
    queryFn: () => getMembershipData(),
  });

  return (
    <header className="flex items-center justify-center bg-[#101824] px-7 py-4">
      <div className="flex w-full max-w-[calc(theme(screens.2xl)-2*theme(padding.7))] items-center gap-8">
        <Link
          href="/"
          className="font-exo text-2xl font-extrabold uppercase tracking-wide"
        >
          sift
          <span className="bg-gradient-to-r from-purple-500 to-indigo-400 bg-clip-text text-transparent">
            vid
          </span>
          .io
        </Link>
        <div className="flex flex-1 items-center justify-between">
          <nav className="flex items-center">
            <ul className="flex gap-8">
              {leftTabs.map((tab) => (
                <Link
                  key={tab}
                  href={tab}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-neutral-300",
                    {
                      "font-bold": tab === pathname,
                    },
                  )}
                >
                  <li className="min-w-[63px] text-center">{tabText(tab)}</li>
                </Link>
              ))}
            </ul>
          </nav>
          <nav className="flex items-center gap-8">
            <SignedIn>
              {!membershipQuery.isLoading ? (
                <>
                  {membershipQuery.data && (
                    <span className="flex items-center gap-4 text-sm font-bold text-emerald-300">
                      {membershipQuery.data.credits !== null ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex gap-4">
                              <span>{`${membershipQuery.data.credits}`}</span>
                              <Icons.credits
                                strokeWidth={2.0}
                                className="size-5"
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              className="text-center"
                              sideOffset={12}
                            >
                              <p className="font-normal">
                                The amount of credits that you can spend
                                <br />
                                to transcribe videos
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                      <span>{`${membershipQuery.data.type ? _.capitalize(membershipQuery.data.type as string) : "Hobby"} ${membershipQuery.data.type !== null ? `(${_.capitalize(membershipQuery.data.status)})` : ""}`}</span>
                    </span>
                  )}
                </>
              ) : (
                <Skeleton className="h-[20px] w-[135px] rounded-xl" />
              )}
              <Link
                href="/videos"
                className={cn(
                  "min-w-[63px] text-center text-sm font-medium transition-colors hover:text-neutral-300",
                  {
                    "font-bold": pathname === "/videos",
                  },
                )}
              >
                Videos
              </Link>
            </SignedIn>
            <div className="flex w-[50px] items-center justify-end">
              <ClerkLoading>
                <Icons.spinner className="size-6 animate-spin text-[#9DA3AE]" />
              </ClerkLoading>
              <ClerkLoaded>
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className={cn(
                      "text-center text-sm font-medium transition-colors hover:text-neutral-300",
                      {
                        "font-bold":
                          pathname ===
                            process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ||
                          pathname ===
                            process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
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
      </div>
    </header>
  );
};

export { Header };
