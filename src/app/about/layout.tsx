export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex size-full justify-center px-3 py-7 sm:p-7">
      <div className="flex w-full max-w-[935px] flex-col gap-7">{children}</div>
    </section>
  );
}
