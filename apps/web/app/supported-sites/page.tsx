import { MDXRemote } from "next-mdx-remote/rsc";

export default async function SupportedSitesPage() {
  const res = await fetch(
    "https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/supportedsites.md",
  );

  const markdown = await res.text();

  return (
    <div className="flex max-w-[850px] flex-col gap-8 rounded-[32px] bg-[#0B111A] p-8 md:p-[46px]">
      <MDXRemote
        source={markdown}
        components={{
          h1: () => (
            <h1 className="text-center text-2xl font-bold">
              Which sites can you upload videos from?
            </h1>
          ),
          li: (props) => <li className="text-lg"> - {props.children}</li>,
        }}
      />
    </div>
  );
}
