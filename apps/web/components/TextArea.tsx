"use client";

import * as React from "react";
import _ from "lodash";

import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface Props<T extends FieldValues>
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  label?: string;
  required?: boolean;
}

const TextArea = <T extends FieldValues>({
  name,
  label,
  register,
  errors,
  required = false,
  ...props
}: Props<T>) => {
  const MIN_ROWS = 4;

  const [rows, setRows] = React.useState(MIN_ROWS);

  const error = _.get(errors, name) as FieldError | undefined;

  return (
    <fieldset className="flex flex-col gap-2">
      {label && <label htmlFor={name}>{required ? `${label}*` : label}</label>}
      <textarea
        rows={rows}
        className="placeholder:text-[#9DA3AE]-500 h-full max-h-[250px] resize-none rounded-[32px] border border-[#212A36] bg-transparent px-5 py-3 text-[#9DA3AE] focus:outline-none disabled:cursor-not-allowed"
        id={name}
        {...register(name, {
          onChange: (e) => {
            const rows = e.target.value.split("\n").length;

            if (rows < MIN_ROWS) {
              setRows(MIN_ROWS);
            } else {
              setRows(e.target.value.split("\n").length);
            }
          },
        })}
        {...props}
      />
      <p className="mx-3 min-h-[20px] text-sm text-red-500">
        {error?.message && error.message}
      </p>
    </fieldset>
  );
};

export { TextArea };
