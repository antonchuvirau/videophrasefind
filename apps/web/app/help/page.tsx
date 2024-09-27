import { type Metadata } from "next";
import Image from "next/image";

const steps: {
  text: string;
  img?: {
    src: string;
    alt: string;
  };
}[] = [
  {
    text: "Navigate to https://siftvid.io",
  },
  {
    text: `Click the "Paste video URL" input`,
    img: {
      src: "/help/step-2.png",
      alt: "step 2 image",
    },
  },
  {
    text: `Paste the result`,
  },
  {
    text: `Click "Drag & Drop" or Choose video to upload`,
    img: {
      src: "/help/step-4.png",
      alt: "step 4 image",
    },
  },
  {
    text: `Click "Submit"`,
    img: {
      src: "/help/step-5.png",
      alt: "step 5 image",
    },
  },
  {
    text: `Click the "Filter" field`,
    img: {
      src: "/help/step-6.png",
      alt: "step 6 image",
    },
  },
  {
    text: "Enter Keyword Search",
  },
  {
    text: "Double-click on keyword instance to jump to",
    img: {
      src: "/help/step-8.png",
      alt: "step 8 image",
    },
  },
];

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Help",
  description: "Help page is here to teach you how to use the app",
};

export default function Help() {
  return (
    <div className="flex w-full max-w-[800px] flex-col gap-7">
      <h2 className="text-center">How to use the app?</h2>
      <ul className="flex flex-col items-center gap-5 sm:text-lg">
        {steps.map((step, index) => (
          <li
            key={index + 1}
            className="flex w-full flex-col justify-center gap-7 rounded-[32px] bg-[#0B111A] p-5 sm:p-8"
          >
            <div className="flex items-center gap-5">
              <span className="inline-flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 font-semibold">
                {index + 1}
              </span>
              <h3>{step.text}</h3>
            </div>
            {step.img && (
              <div className="items-center justify-center overflow-hidden rounded-2xl border border-[#212A36]">
                <Image
                  width={1200}
                  height={720}
                  src={step.img.src}
                  alt={step.img.alt}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
