import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["gizmo", "3xs", "2xs", "control", "button-sm", "symbol"],
      radius: [
        "hairline",
        "preview",
        "direction",
        "control",
        "inset",
        "compact",
        "button",
      ],
      tracking: ["label", "section"],
      blur: ["hairline"],
      shadow: [
        "color-handle-edge",
        "wipe-slash",
        "color-stop",
        "color-stop-active",
        "slider-thumb",
        "export-preview",
        "light-source",
        "dialog",
        "color-slider-handle",
        "color-area-handle",
        "light-dial",
        "mesh-handle",
        "timeline-selection",
        "export-setting",
        "color-area",
        "mesh-preview",
        "color-rail",
        "timeline-clip",
        "color-stop-gloss",
        "finish-mosaic",
        "finish-swatch",
        "preset-selection",
      ],
    },
    classGroups: {
      "bg-image": [
        "bg-preview-image",
        "bg-finish-highlight",
        "bg-motion-preview",
        "bg-transition-window",
        "bg-transition-window-hover",
        "bg-color-area",
      ],
      "bg-size": ["bg-preview-size"],
      "bg-position": ["bg-preview-position"],
      "ring-w": ["ring-editor"],
      "border-w": ["border-preview"],
      "stroke-w": ["stroke-axis"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Preserve percentages and calc() geometry while giving numeric lengths CSS units. */
export function cssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value
}
