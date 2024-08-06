import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Date(date.toString()).toLocaleDateString(undefined, {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  });
}

export function formatTime(date: Date) {
  return new Date(date.toString()).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}
