"use client";

import { useDropzone, FileWithPath } from "react-dropzone";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import useZodForm from "@/hooks/useZodForm";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { Icons } from "@/components/Icons";

import {
  fetchYTVideoAndTriggerTranscription,
  getUploadUrl,
  triggerTranscription,
} from "@/app/actions";
import { createVideo, saveVideoTitleAndSize } from "@/app/video-actions";

export const schema = z.object({
  ytUrl: z
    .string()
    .url({ message: "Invalid URL" })
    .transform((s) => s.replaceAll(/&.*$/g, "")) // Cleanup youtube links
    .or(z.literal("")),
});

export default function VideoForm() {
  const [status, setStatus] = useState("no status");

  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useZodForm({
    schema,
    defaultValues: {
      ytUrl: "",
    },
    mode: "onBlur",
  });

  const files = acceptedFiles.map((file: FileWithPath) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const createVideoMutation = useMutation({
    onMutate: () => {
      setStatus("Triggering save video metadata jobs...");
    },
    mutationFn: () => createVideo(),
  });

  const externalUploadMutation = useMutation({
    onMutate: () => {
      setStatus("Triggering video upload to our storage...");
    },
    mutationFn: ({ ytUrl, videoId }: { ytUrl: string; videoId: string }) =>
      fetchYTVideoAndTriggerTranscription(ytUrl, videoId), // Video transcription on 12Labs will be triggered automatically
  });

  const localUploadMutation = useMutation({
    onMutate: () => {
      setStatus("Uploading your video to our storage...");
    },
    mutationFn: async ({ file, videoId }: { file: File; videoId: string }) => {
      await fetch(await getUploadUrl(videoId), {
        method: "PUT",
        body: file,
      });

      await saveVideoTitleAndSize({
        id: videoId,
        title: file.name.split(".")[0],
        size: file.size,
      });

      return triggerTranscription(videoId); // Trigger video transcription on 12Labs manually
    },
  });

  if (
    isSubmitting ||
    isPending ||
    localUploadMutation.isPending ||
    externalUploadMutation.isPending ||
    createVideoMutation.isPending
  )
    return (
      <div className="flex w-full max-w-[512px] flex-col items-center gap-4">
        <Icons.spinner className="size-20 animate-spin text-[#9DA3AE]" />
        <div className="text-center">
          <h2 className="mb-4 text-lg font-bold">Video processing...</h2>
          <p className="text-md animate-slide text-center text-[#9DA3AE]">
            {status}
          </p>
        </div>
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit(({ ytUrl }) => {
        createVideoMutation.mutate(undefined, {
          onSuccess: async (videoId) => {
            if (ytUrl) {
              const { message } = await externalUploadMutation.mutateAsync({
                ytUrl,
                videoId,
              });
              console.log({ message });
            } else {
              const { message } = await localUploadMutation.mutateAsync({
                file: acceptedFiles[0],
                videoId,
              });
              console.log({ message });
            }
            /*
              If I do redirect on the server side,
              redirect time is not included in the mutation isPending time
            */
            startTransition(() => {
              router.push(`/video/${videoId}`);
            });
          },
        });
      })}
      className="flex w-full flex-col items-center gap-8 rounded-[32px] bg-[#0B111A] p-4 min-[1050px]:max-w-[512px]"
    >
      <section className="size-full">
        <div
          {...getRootProps({
            className:
              "dropzone w-full h-full aspect-[4/3] border-dashed border-[#212A36] border-[1px] rounded-[32px] bg-[#212A361A] cursor-pointer",
          })}
        >
          <input {...getInputProps()} />
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Image
              className="mb-5"
              src="/upload.svg"
              alt=""
              width="25"
              height="25"
            />
            {!files.length ? (
              <p className="text-center font-semibold text-[#9DA3AE]">
                Drag & Drop or <span className="text-white">Choose video</span>
                <br />
                to upload
              </p>
            ) : (
              <p className="text-[#9DA3AE]-500 text-center text-[#9DA3AE]">
                {files}
              </p>
            )}
          </div>
        </div>
      </section>
      <div className="flex w-full items-center">
        <div className="flex-1 border-b border-[#212A36]"></div>
        <div className="px-[27px] text-base font-medium text-[#9DA3AE]">or</div>
        <div className="flex-1 border-b border-[#212A36]"></div>
      </div>
      <Input
        className="w-full"
        placeholder="Paste video URL"
        name="ytUrl"
        register={register}
        errors={errors}
      />
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          isPending ||
          localUploadMutation.isPending ||
          externalUploadMutation.isPending ||
          createVideoMutation.isPending ||
          !isValid ||
          (!isDirty && acceptedFiles.length === 0)
        }
      >
        Submit
      </Button>
    </form>
  );
}
