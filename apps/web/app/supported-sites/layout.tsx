export default function SupportedSitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-full justify-center gap-5">{children}</section>
  );
}
