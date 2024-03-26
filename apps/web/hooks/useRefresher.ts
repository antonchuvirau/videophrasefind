import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function useRefresher({
  interval = 7000,
  enabled = true,
}: {
  interval?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (enabled) {
      const int = setInterval(() => {
        // TODO: exponential backoff?
        console.log("Refetching");
        router.refresh();
      }, interval);

      return () => clearInterval(int);
    }
  }, [router, enabled, interval]);
}
