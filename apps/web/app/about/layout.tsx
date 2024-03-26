export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-full items-center justify-center">
      <div className="flex w-full max-w-[800px] flex-col gap-7">{children}</div>
    </section>
  );
}
