"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = ["/", "/about", "/help", "/contact"] as const;

const capitalize = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
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
        <nav>
          <ul className="flex gap-10">
            {tabs.map((tab) => (
              <Link
                className={`${tab === pathname ? "font-bold" : "font-medium hover:text-neutral-300"} transition-colors`}
                key={tab}
                href={tab}
              >
                <li className="min-w-[63px] text-center">
                  {tab === "/" ? "Home" : capitalize(tab.slice(1))}
                </li>
              </Link>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export { Header };
