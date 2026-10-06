"use client"

import React, { useEffect, useRef, useState } from "react"
import { AlertTriangle, Code2, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ExportAssetOptions } from "./ExportAssetOptions"
import { ExportAndroidCodeTab, ExportReactCodeTab } from "./ExportCodeTabs"
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
  artwork?: { svgContent: string; label: string; color: string }
  onCodeCopied?: () => void
}

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
  artwork,
}) => {
  const [developerOpen, setDeveloperOpen] = useState(false)
  useEffect(() => {
    if (!isOpen) setDeveloperOpen(false)
  }, [isOpen])
  const finalFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (isOpen && document.activeElement instanceof HTMLElement) {
      finalFocusRef.current = document.activeElement
    }
  }, [isOpen])

  const {
    activeTab,
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
        variant="flush"
        finalFocus={finalFocusRef}
        className="max-h-(--spacing-dialog-height) w-190 max-w-(--spacing-screen-inset-4) overflow-hidden sm:max-w-190"
      >
        <DialogHeader variant="export" className="flex-row items-center">
          <DialogTitle variant="editor">Export your icon</DialogTitle>
          {isRecording ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <span
                aria-hidden="true"
                className="size-1.5 animate-pulse rounded-full bg-destructive"
              />
              Recording {Math.round(videoExportProgress * 100)}%
            </span>
          ) : null}
          <DialogDescription className="sr-only">
            {artwork?.label ? `${artwork.label}. ` : ""}Choose how you’d like to
            use it.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          spacing="flush"
          value={activeTab}
          onValueChange={handleTabChange}
          className="min-h-0 min-w-0"
        >
          <div
            className={
              developerOpen ? "border-b border-border px-6 py-3" : "hidden"
            }
          >
            <TabsList className="grid h-11 w-full grid-cols-3">
              <TabsTrigger value="options" className="min-h-11">
                {isRecording ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-1.5 animate-pulse rounded-full bg-destructive"
                    />
                    Assets · {Math.round(videoExportProgress * 100)}%
                  </>
                ) : (
                  "Assets"
                )}
              </TabsTrigger>
              <TabsTrigger
                value="r3f"
                disabled={isRecording}
                className="min-h-11"
              >
                React starter
              </TabsTrigger>
              <TabsTrigger
                value="android"
                disabled={isRecording}
                className="min-h-11"
              >
                Android viewer
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 min-w-0 overflow-hidden bg-background">
            {exportError ? (
              <div
                role="alert"
                className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs leading-5 text-foreground"
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
                  className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : null}
            <TabsContent
              value="options"
              className="min-w-0 max-md:max-h-(--spacing-export-mobile) max-md:overflow-y-auto"
            >
              <ExportAssetOptions
                isRecording={isRecording}
                isGltfExporting={isGltfExporting}
                isPngExporting={isPngExporting}
                exportedGltf={justExported.gltf ?? false}
                exportedPng={justExported.png ?? false}
                exportedVideo={justExported.video ?? false}
                progress={videoExportProgress}
                durationSeconds={scene.duration}
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
            </TabsContent>

            <TabsContent value="r3f" className="min-w-0">
              <ExportReactCodeTab
                code={r3fCode}
                copied={isCopied}
                onCopy={handleCopyCode}
              />
            </TabsContent>

            <TabsContent value="android" className="min-w-0">
              <ExportAndroidCodeTab
                gradleCode={androidGradleCode}
                filamentCode={androidFilamentCode}
                copied={isCopied}
                onCopy={handleCopyCode}
              />
            </TabsContent>
          </div>
        </Tabs>
        <div className="border-t border-border px-4 py-1">
          <button
            type="button"
            aria-pressed={developerOpen}
            disabled={isRecording}
            onClick={() => {
              setDeveloperOpen(!developerOpen)
              handleTabChange("options")
            }}
            className="flex min-h-9 items-center gap-2 rounded-md px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          >
            <Code2 aria-hidden="true" className="size-3.5" />
            Developer exports
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
