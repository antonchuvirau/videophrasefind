import { Icons } from "@/components/Icons";
import { type Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "About page contains essential information and purpose of the project",
};

export default function About() {
  return (
    <div className="flex max-w-[800px] flex-col gap-11 rounded-[32px] bg-[#0B111A] p-8 md:p-[46px]">
      <div className="flex flex-col gap-8 text-center">
        <h2>About the project</h2>
        <p className="text-white/70 sm:text-lg">
          With video becoming the dominant form of media being consumed, we are
          building a robust engine to search and sift easily to deliver accurate
          results. The engine utilizes the audio in the video for transcriptions
          and indexes the words to be used in the search.
        </p>
      </div>
      <div className="rounded-xl bg-[#121821] p-6">
        <span className="flex items-center gap-3">
          <span className="rounded-full bg-purple-600 p-3">
            <Icons.key className="size-5" />
          </span>
          <h3 className="text-xl">Video search:</h3>
        </span>
        <p className="mt-6 text-white/70 md:text-lg">
          Search a video for <span className="text-purple-700">keyword</span>{" "}
          for phrase by pasting a link or uploading a movie file.
        </p>
      </div>
      <div id="semantic-search" className="rounded-xl bg-[#121821] p-6">
        <span className="flex items-center gap-3">
          <span className="rounded-full bg-purple-600 p-3">
            <Icons.messageSquareQuote className="size-5" />
          </span>
          <h3 className="text-xl">Semantic search:</h3>
        </span>
        <div className="mt-6 text-white/70 md:text-lg">
          <p>
            The platform determines the meaning of a{" "}
            <span className="text-purple-700">search query</span>, rather than
            just matching the keywords you&apos;ve specified to the content of
            your videos.
          </p>
          <p className="mt-6">
            Use this value when understanding the meaning of language and the
            relationships between different concepts and entities is required.
          </p>
        </div>
      </div>
      <p className="text-center text-white/50">
        Give us{" "}
        <Link
          className="text-purple-700 underline underline-offset-4"
          href="/contact"
        >
          feedback
        </Link>{" "}
        or let us know how we can improve here!
      </p>
    </div>
  );
}
