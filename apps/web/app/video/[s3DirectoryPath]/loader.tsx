import Image from "next/image";

export default function Loader({ message }: { message?: string }) {
  return (
    <div className="align-center m-auto flex flex-col items-center gap-8">
      <Image
        className="mt-[18px] animate-spin cursor-pointer"
        src="/loading.svg"
        alt=""
        width="77"
        height="77"
      />
      {message && <span className="text-center">{message}</span>}
    </div>
  );
}
