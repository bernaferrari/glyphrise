import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Preserve percentages and calc() geometry while giving numeric lengths CSS units. */
export function cssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value
}
