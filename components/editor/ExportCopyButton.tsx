"use client"

import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

type ExportCopyButtonProps = {
  copied: boolean
  onCopy: () => void
  label?: string
  /** Primary fills the footer action; the default sits quietly in a file header. */
  variant?: "quiet" | "primary"
}

export function ExportCopyButton({
  copied,
  onCopy,
  label = "Copy code",
  variant = "quiet",
}: ExportCopyButtonProps) {
  const Icon = copied ? Check : Copy
  return variant === "primary" ? (
    <Button
      shape="rounded"
      onClick={onCopy}
      className="h-10 min-w-48 max-sm:h-11 max-sm:w-full"
    >
      <Icon aria-hidden="true" className="size-4" />
      {copied ? "Copied" : label}
    </Button>
  ) : (
    <Button size="sm" variant="ghost" onClick={onCopy}>
      <Icon
        aria-hidden="true"
        className={copied ? "size-3.5 text-success" : "size-3.5"}
      />
      {copied ? "Copied" : label}
    </Button>
  )
}
