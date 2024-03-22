import _ from "lodash";
import { type InputHTMLAttributes } from "react";
import {
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import Image from "next/image";

type Props<T extends FieldValues> = InputHTMLAttributes<HTMLInputElement> & {
  name: Path<T>;
  label?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  inputClassName?: string;
};

/// This is react-hook-form compatible version of Input
export default function Search<T extends FieldValues>({
  name,
  label,
  register,
  errors,
  className = "mb-5",
  inputClassName = "",
  required,
  ...rest
}: Props<T>) {
  const error = _.get(errors, name) as FieldError | undefined;

  return (
    <fieldset className={`relative flex flex-col ${className}`}>
      {/*labelName && <Label name={labelName} required={required} />*/}
      <Image
        className="absolute left-[18px] top-[12px] mb-5 ml-auto mr-auto cursor-pointer"
        src="/search.svg"
        alt=""
        width="25"
        height="25"
      />
      <input
        id={name}
        className={`
          placeholder:text-[#9DA3AE]-500 w-full rounded-[32px] border-[1px]
          border-[#212A36] bg-[#ffffff1f] py-3 pl-[48px] pr-5 text-[#9DA3AE] focus:outline-none disabled:cursor-not-allowed ${inputClassName}
        `}
        type={rest.type}
        {...register(name, {
          valueAsNumber: rest.type === "number",
          required,
        })}
        {...rest}
      />
      {error?.message && (
        <p className="absolute bottom-[-20px] mx-5 text-sm text-red-500">
          {error.message}
        </p>
      )}
    </fieldset>
  );
}
