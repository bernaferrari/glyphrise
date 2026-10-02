"use client"

import React, { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  onExportPng: (settings: ExportSettings) => Promise<void>
  onExportVideo: (settings: ExportSettings) => Promise<void>
  onCancelVideoExport: () => void
  isVideoExporting: boolean
  videoExportProgress: number
  scene: ExportSceneSnapshot
  onCodeCopied?: () => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportGltf,
  onExportPng,
  onExportVideo,
  onCancelVideoExport,
  isVideoExporting,
  onCodeCopied,
  videoExportProgress,
  scene,
}) => {
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
        if (!open) onClose()
      }}
    >
      <DialogContent
        finalFocus={finalFocusRef}
        className="max-h-[calc(100vh-40px)] w-[640px] max-w-[calc(100vw-32px)] gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-[640px]"
      >
        <DialogHeader className="border-b border-border px-4 py-3 pr-11">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Export
            {isRecording ? (
              <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-xs font-normal text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-pulse rounded-full bg-destructive motion-reduce:animate-none"
                />
                Recording {Math.round(videoExportProgress * 100)}%
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="min-h-0 min-w-0 gap-0"
        >
          <div className="border-b border-border px-4 py-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="options" className="gap-1.5">
                {isRecording ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-1.5 animate-pulse rounded-full bg-destructive motion-reduce:animate-none"
                    />
                    Assets · {Math.round(videoExportProgress * 100)}%
                  </>
                ) : (
                  "Assets"
                )}
              </TabsTrigger>
              <TabsTrigger value="r3f" disabled={isRecording}>
                React starter
              </TabsTrigger>
              <TabsTrigger value="android" disabled={isRecording}>
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
              className="editor-scrollbar max-h-[calc(100dvh-180px)] min-w-0 overflow-y-auto p-4 outline-none"
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
                onSettingsChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="r3f" className="min-w-0 outline-none">
              <ExportReactCodeTab
                code={r3fCode}
                copied={isCopied}
                onCopy={handleCopyCode}
              />
            </TabsContent>

            <TabsContent value="android" className="min-w-0 outline-none">
              <ExportAndroidCodeTab
                gradleCode={androidGradleCode}
                filamentCode={androidFilamentCode}
                copied={isCopied}
                onCopy={handleCopyCode}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
