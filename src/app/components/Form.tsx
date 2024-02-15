"use client";

import { useDropzone, FileWithPath } from "react-dropzone";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import useZodForm from "@/app/hooks/useZodForm";

import Button from "@/app/components/Button";
import Input from "@/app/components/Input";

import {
  fetchTranscriptionResult,
  getUploadUrl,
  triggerVideoTranscription,
} from "@/app/actions";

import Loader from "@/app/video/[...s3DirectoryPath]/loader";

export const schema = z.object({
  videoUrl: z
    .string()
    .url()
    .transform((s) => s.replaceAll(/&.*$/g, "")) // Cleanup youtube links
    .or(z.literal("")),
});

export default function Form() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isSubmitted, isDirty },
  } = useZodForm({
    schema,
    defaultValues: {
      videoUrl: "",
    },
    mode: "onBlur",
  });

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

  const files = acceptedFiles.map((file: FileWithPath) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const { uploadUrl, s3Directory, downloadUrl } = await getUploadUrl();

      await fetch(uploadUrl, {
        method: "PUT",
        body: acceptedFiles[0],
      });

      return { s3Directory, videoUrl: downloadUrl };
    },
  });

  const onSubmit = handleSubmit(async (formData) => {
    const { videoUrl, s3Directory } = formData.videoUrl
      ? {
          videoUrl: formData.videoUrl,
          s3Directory: encodeURIComponent(formData.videoUrl),
        }
      : await uploadMutation.mutateAsync();

    console.log({ videoUrl, s3Directory });
    const json = await fetchTranscriptionResult(s3Directory);
    if (!json) await triggerVideoTranscription(videoUrl);

    startTransition(() => {
      router.push(`/video/${s3Directory}`);
    });
  });

  if (uploadMutation.isPending)
    return <Loader message="Uploading your video" />;

  if (isSubmitting || isPending)
    return <Loader message="Initializing video processing" />;

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-h-[650px] w-full max-w-[512px] flex-col items-center gap-8 rounded-[32px] bg-[#0B111A] p-4"
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
        name="videoUrl"
        register={register}
        errors={errors}
      />
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          isPending ||
          uploadMutation.isPending ||
          !isValid ||
          (!isDirty && acceptedFiles.length === 0)
        }
      >
        Submit
      </Button>
    </form>
  );
}
