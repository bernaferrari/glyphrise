"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Box,
  Code2,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ExportAssetOptions, type AssetFormat } from "./ExportAssetOptions"
import { ExportCodeView, type CodeTarget } from "./ExportCodeTabs"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import type { ExportSettings } from "./ExportSettingsModel"
import { useExportModalController } from "./useExportModalController"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExportGltf: () => Promise<void>
  onCapturePreview: (settings: ExportSettings) => Promise<Blob>
  onExportPng: (settings: ExportSettings) => Promise<void>
  onExportVideo: (settings: ExportSettings) => Promise<void>
  onCancelVideoExport: () => void
  isVideoExporting: boolean
  videoExportProgress: number
  scene: ExportSceneSnapshot
  onCodeCopied?: () => void
}

type Format = AssetFormat | "code"

const FORMATS: { id: Format; label: string; Icon: typeof ImageIcon }[] = [
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "video", label: "Video", Icon: Video },
  { id: "model", label: "3D model", Icon: Box },
  { id: "code", label: "Code", Icon: Code2 },
]

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportGltf,
  onExportPng,
  onCapturePreview,
  onExportVideo,
  onCancelVideoExport,
  isVideoExporting,
  onCodeCopied,
  videoExportProgress,
  scene,
}) => {
  const [format, setFormat] = useState<Format>("image")
  const [codeTarget, setCodeTarget] = useState<CodeTarget>("r3f")
  const finalFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (isOpen && document.activeElement instanceof HTMLElement) {
      finalFocusRef.current = document.activeElement
    }
  }, [isOpen])

  const {
    androidFilamentCode,
    androidGradleCode,
    handleCopyCode,
    handleGltfExport,
    handleTabChange,
    handleVideoExport,
    isCopied,
    isGltfExporting,
    isPngExporting,
    isRecording,
    justExported,
    videoExportCanceled,
    exportError,
    clearExportError,
    r3fCode,
    settings,
    supportedVideoContainers,
    updateSettings,
    handlePngExport,
  } = useExportModalController({
    isOpen,
    scene,
    onExportGltf,
    onExportPng,
    onExportVideo,
    isVideoExporting,
    onCodeCopied,
  })

  useEffect(() => {
    if (!isOpen) {
      setFormat("image")
      setCodeTarget("r3f")
    }
  }, [isOpen])

  // Code is generated lazily, only for the target on screen.
  useEffect(() => {
    handleTabChange(format === "code" ? codeTarget : "options")
  }, [codeTarget, format, handleTabChange])

  const busy = isRecording || isGltfExporting || isPngExporting

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (isRecording) onCancelVideoExport()
          onClose()
        }
      }}
    >
      <DialogContent
        variant="sheet"
        finalFocus={finalFocusRef}
        className="max-h-(--spacing-dialog-height) w-220 max-w-(--spacing-screen-inset-4) sm:max-w-220"
      >
        <DialogHeader variant="export">
          <DialogTitle variant="preset">Export</DialogTitle>
          <DialogDescription className="sr-only">
            Export your artwork as an image, video, GLB model or code.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 px-5 pb-4">
          <div
            role="group"
            aria-label="Export format"
            className="grid grid-cols-4 gap-1 rounded-xl bg-muted/70 p-1"
          >
            {FORMATS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={format === id}
                disabled={busy && format !== id}
                onClick={() => {
                  if (id === "video")
                    updateSettings({ backgroundMode: "color" })
                  setFormat(id)
                }}
                className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 max-[400px]:hidden"
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {exportError ? (
          <div
            role="alert"
            className="mx-5 mb-3 flex shrink-0 items-center gap-3 rounded-lg border border-destructive/35 bg-destructive/10 py-1 pr-1 pl-3 text-xs leading-5 text-foreground"
          >
            <AlertTriangle
              aria-hidden="true"
              className="size-4 shrink-0 text-destructive"
            />
            <span className="min-w-0 flex-1">{exportError}</span>
            <button
              type="button"
              aria-label="Dismiss export error"
              onClick={clearExportError}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : null}

        {format === "code" ? (
          <ExportCodeView
            target={codeTarget}
            onTargetChange={setCodeTarget}
            r3fCode={r3fCode}
            gradleCode={androidGradleCode}
            filamentCode={androidFilamentCode}
            copied={isCopied}
            onCopy={handleCopyCode}
          />
        ) : (
          <ExportAssetOptions
            format={format}
            isRecording={isRecording}
            isGltfExporting={isGltfExporting}
            isPngExporting={isPngExporting}
            exportedGltf={justExported.gltf ?? false}
            exportedPng={justExported.png ?? false}
            exportedVideo={justExported.video ?? false}
            progress={videoExportProgress}
            onExportGltf={handleGltfExport}
            onExportPng={handlePngExport}
            onExportVideo={handleVideoExport}
            onCancelVideoExport={onCancelVideoExport}
            videoExportCanceled={videoExportCanceled}
            settings={settings}
            supportedVideoContainers={supportedVideoContainers}
            onCapturePreview={onCapturePreview}
            onSettingsChange={updateSettings}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
