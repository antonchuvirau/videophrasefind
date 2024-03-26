"use client";

import { z } from "zod";

import useZodForm from "@/hooks/useZodForm";

import Input from "@/components/Input";
import Button from "@/components/Button";
import { TextArea } from "@/components/TextArea";

const contactSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  description: z.string().min(1, { message: "Description is required" }),
});

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useZodForm({
    schema: contactSchema,
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      description: "",
    },
    mode: "onBlur",
  });

  return (
    <form
      className="flex max-h-max flex-col gap-4"
      onSubmit={handleSubmit((data: z.infer<typeof contactSchema>) => {
        console.log(data);
      })}
    >
      <Input
        required
        placeholder="What is your name?"
        name="name"
        label="Name"
        errors={errors}
        register={register}
      />
      <Input
        required
        placeholder="Contact email"
        name="email"
        label="Email"
        errors={errors}
        register={register}
      />
      <Input
        required
        placeholder="What is your question about?"
        name="subject"
        label="Subject"
        errors={errors}
        register={register}
      />
      <TextArea
        required
        name="description"
        label="Description"
        placeholder="Describe in detail your problem or proposition"
        errors={errors}
        register={register}
      />
      <Button disabled={!isDirty || !isValid || isSubmitting}>
        Submit a request
      </Button>
    </form>
  );
}
