import { ClerkProvider as CP } from "@clerk/nextjs";

export default function ClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CP
      appearance={{
        variables: {
          colorPrimary: "#9333ea",
          colorBackground: "#0b111a", // card bg -> #0b1019 irl, without 'card: "bg-[#0b111a]"',
          colorText: "white",
          colorInputBackground: "transparent",
          colorInputText: "#9DA3AE",
          colorNeutral: "#cbd5e1",
          colorSuccess: "#6ee7b7", // emerald-300
          colorDanger: "#ef4444", // red-500
        },
        elements: {
          card: "bg-[#0b111a]",
          providerIcon__apple: "invert-[1]",
        },
      }}
    >
      {children}
    </CP>
  );
}
