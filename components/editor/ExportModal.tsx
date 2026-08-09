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
import { useExportModalController } from "./useExportModalController"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExportGltf: () => Promise<void>
  onExportVideo: () => Promise<void>
  isVideoExporting: boolean
  videoExportProgress: number
  scene: ExportSceneSnapshot
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportGltf,
  onExportVideo,
  isVideoExporting,
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
    isRecording,
    exportError,
    clearExportError,
    r3fCode,
  } = useExportModalController({
    scene,
    onExportGltf,
    onExportVideo,
    isVideoExporting,
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
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="min-h-0 min-w-0 gap-0"
        >
          <div className="border-b border-border px-4 py-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="options">Assets</TabsTrigger>
              <TabsTrigger value="r3f">React</TabsTrigger>
              <TabsTrigger value="android">Android</TabsTrigger>
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
            <TabsContent value="options" className="min-w-0 p-4 outline-none">
              <ExportAssetOptions
                isRecording={isRecording}
                isGltfExporting={isGltfExporting}
                progress={videoExportProgress}
                onExportGltf={handleGltfExport}
                onExportVideo={handleVideoExport}
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
