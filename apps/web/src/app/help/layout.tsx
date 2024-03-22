export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex size-full justify-center gap-7">
      <div className="flex w-full max-w-[800px] flex-col gap-7">{children}</div>
    </section>
  );
}
