export default async function SupportedSitesPage() {
  const res = await fetch(
    "https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/supportedsites.md",
  );

  const text = await res.text();

  return <div>Supported sites list</div>;
}
