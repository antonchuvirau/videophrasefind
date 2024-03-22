"use client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const onError = useCallback((error: unknown) => {
    const message = (error as Error).message;
    toast.error(message);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError }),
        mutationCache: new MutationCache({ onError }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
