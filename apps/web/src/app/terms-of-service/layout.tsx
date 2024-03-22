export default function TermsAndConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex size-full justify-center">{children}</section>
  );
}
