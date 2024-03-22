"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();

  if (pathname === "/terms-of-service") return null;

  return (
    <footer className="flex w-full justify-center bg-[#161E2A] px-7 py-4">
      <div className="inline-flex gap-10 text-sm">
        <h2>Company</h2>
        <ul>
          <Link href="/terms-of-service">
            <li>Terms of Service</li>
          </Link>
        </ul>
      </div>
    </footer>
  );
};

export { Footer };
