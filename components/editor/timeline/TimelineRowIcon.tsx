import type { CSSProperties } from "react"
import {
  Blend,
  Box,
  Diamond,
  Move3D,
  Palette,
  Rotate3D,
  Scaling,
  Sun,
  SunMedium,
} from "lucide-react"

const ROW_ICONS = {
  rotation: Rotate3D,
  extrusion: Box,
  move: Move3D,
  style: Palette,
  scale: Scaling,
  lighting: Sun,
  "light-position": SunMedium,
  transition: Blend,
} as const

export function TimelineRowIcon({
  id,
  className,
  style,
}: {
  id: string
  className?: string
  style?: CSSProperties
}) {
  const Icon = ROW_ICONS[id as keyof typeof ROW_ICONS] ?? Diamond
  return <Icon aria-hidden="true" className={className} style={style} />
}
