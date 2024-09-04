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
    <div className="flex max-w-[800px] flex-col gap-14 rounded-[32px] bg-[#0B111A] p-8 md:p-[46px]">
      <div className="flex flex-col gap-8">
        <h2 className="text-[26px] font-medium leading-[30px]">
          About the project
        </h2>
        <div className="flex flex-col gap-5 text-white/70 sm:text-lg">
          <p>
            With video becoming the dominant form of media being consumed, we
            are building a robust engine to search and sift easily to deliver
            accurate results.
          </p>
          <p>
            Give us{" "}
            <Link className="text-purple-600 underline" href="/contact">
              feedback
            </Link>{" "}
            or let us know how we can improve here!
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-7">
        <h2 className="text-xl">Video search</h2>
        <div className="rounded-xl border bg-[#0D131C] p-6">
          <div className="text-white/70 md:text-lg">
            <p>
              Search a video for keyword for phrase by pasting a link or
              uploading a movie file.
            </p>
          </div>
        </div>
      </div>
      <div id="semantic-search" className="flex flex-col gap-7">
        <h2 className="text-xl">Semantic search</h2>
        <div className="rounded-xl border border-[#212A36] bg-[#0D131C] p-6">
          <div className="text-white/70 md:text-lg">
            <p>
              When using semantic search, the platform determines the meaning of
              a search query, rather than just matching the keywords you&apos;ve
              specified to the content of your videos. Use this value when
              understanding the meaning of language and the relationships
              between different concepts and entities is required.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-7">
        <h2 className="text-xl">Search a Video with Ease</h2>
        <div className="rounded-2xl border border-[#212A36] bg-[#0D131C] p-6">
          <div className="flex flex-col justify-between gap-5 text-white/70 md:text-lg">
            <p>
              Our tool transcribes the video and allows a user to quickly sift
              the results for any instance of a word or phrase. Jump to the
              various instances of the word search quickly.
            </p>
            <p>
              This may be helpful to search interviews or recorded meetings.
              Scrubbing through hours of footage for a particular moment or
              spoken word is time-consuming. This tool is dedicated to solving
              that issue.
            </p>
            <p>
              Other use cases can be for news reels, documentary footage, or any
              video from YouTube that needs to be searched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
