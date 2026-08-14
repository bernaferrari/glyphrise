# Glyphrise 3D

<p align="center">
  <strong>A browser-based 3D icon motion editor.</strong>
</p>

![Glyphrise 3D editor with a 3D icon, property inspector, and animation timeline](docs/vectorforge-editor.png)

Glyphrise 3D turns flat SVG artwork and Material Symbols into animated 3D
assets. Extrude a shape, give it a material, animate it with keyframes, and
export the result—all in the browser.

It is designed for product designers, motion designers, and developers who want
to create polished 3D icons without moving between a vector editor, a full 3D
suite, and an animation tool.

> **Project status:** Glyphrise 3D is a polished local-first prototype. Projects
> are stored in your browser and exports are generated on your device. Accounts,
> cloud sync, and real-time collaboration are not part of the current release.

## What you can make

- Animated 3D product and interface icons
- Extruded logos and SVG marks
- Material and lighting studies
- Short looping WebM motion assets
- GLB assets for web and Android projects
- React Three Fiber and Android Filament implementation starters

## The workflow

1. **Choose an icon** — Search Material Symbols, start from a preset, or upload
   your own SVG.
2. **Give it depth** — Adjust extrusion, bevels, transforms, per-path geometry,
   materials, and lighting in the live 3D viewport.
3. **Bring it to life** — Sequence icon clips and animate properties with
   keyframes, easing, snapping, and timeline playback.
4. **Export it** — Download a GLB or WebM, or copy starter code for React Three
   Fiber and Android Filament.

## Highlights

- **Live 3D viewport** — Rotate the scene, nudge the view, manipulate transforms,
  and inspect every change immediately.
- **Motion timeline** — Arrange icon clips and animate properties with
  keyframes, easing curves, snapping, zoom, and contextual controls.
- **Materials and lighting** — Build solid and mesh-gradient fills with glass,
  gel, metal, and cut-style finishes.
- **Per-path SVG styling** — Control visibility, color, depth, and scale for
  individual paths inside complex artwork.
- **Predictable editing** — Keep static edits separate from animation with
  explicit auto-key behavior and gesture-level undo.
- **Local project management** — Create, duplicate, autosave, import, and export
  named projects without an account.
- **Desktop and compact workspaces** — Use the complete editor on desktop or
  switch between dedicated Preview, Properties, and Timeline views on smaller
  screens.
- **Accessible interaction** — Navigate with a keyboard, edit with touch or a
  pointer, and respect reduced-motion preferences.

## Quick start

### Requirements

- [Node.js 24.x](https://nodejs.org/)
- [pnpm 11.x](https://pnpm.io/installation)
- Google Chrome, if you want to run the end-to-end tests

```bash
git clone https://github.com/bernaferrari/vectorforge.git
cd vectorforge
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Create your first animated 3D icon

1. Open **Project** and choose **Projects**.
2. Start with **Example project** to explore a finished composition, or choose
   **Blank project** for a clean canvas.
3. Select the icon clip and choose **Change** to search Material Symbols or
   upload an SVG.
4. Use **Style**, **Geometry**, **Transform**, and **Light** to shape the result.
5. Move the playhead and add keyframes, or enable **Auto-key** before adjusting
   animated properties.
6. Choose **Export** to download the asset or inspect implementation code.

## Projects and persistence

Glyphrise 3D stores named projects in browser storage and autosaves each one
independently. Switching projects flushes pending edits first, and deleting the
current project safely opens another project or creates a fresh fallback.

Use **Project → Download backup** to keep a portable JSON copy. Clearing browser
site data removes projects that have not been downloaded, and local projects do
not automatically sync between browsers or devices.

## Export support

| Target                | Best for                              | Current fidelity                                                                                                                                                                                        |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GLB**               | 3D asset handoff                      | Exports the current icon as a Filament-ready binary glTF asset using compatible geometry and material fields.                                                                                           |
| **WebM**              | Motion previews and rendered delivery | Records the canvas through one complete timeline pass and restores the prior playhead and playback state afterward.                                                                                     |
| **React Three Fiber** | Web implementation starting point     | Preserves timing, transforms, wipes, path visibility/depth/scale, per-path colors, animated lighting, and standard PBR settings. Mesh gradients, custom finish shaders, and crown roofs are simplified. |
| **Android Filament**  | Native Android 3D viewer reference    | Provides Gradle and Kotlin starter code for a static exported GLB. It does not reproduce editor timeline playback.                                                                                      |

The Android sample expects the exported asset at:

```text
app/src/main/assets/exports/icon.glb
```

## Development

Run the complete local quality suite before shipping changes:

```bash
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

The current automated suite includes 72 unit tests and nine Playwright workflows
covering blank and template projects, project duplication/deletion recovery,
custom SVG upload, phone-sized workspace views, immediate-reload persistence,
gesture-level undo, and export messaging.

### Architecture

```text
app/
  page.tsx                    Editor entry point
  layout.tsx                  App shell, fonts, and providers
  globals.css                 Tailwind theme tokens

components/3d/
  SvgCanvas.tsx               Three.js viewport boundary
  SvgModelBuilder.ts          Renderable icon groups
  SvgShapeGeometry.ts         SVG-to-extruded-geometry pipeline
  StraightSkeleton.ts         Medial roof geometry for cut finishes
  MaterialPresets.ts          Material presets and shaders
  TransformGizmo*.ts          Direct transform controls

components/editor/
  AppLayout.tsx               Editor composition
  EditorModel.ts              Shared editor data model
  ShapeSequenceModel.ts       Shape clips and transitions
  TimelineModel.ts            Tracks, keyframes, and interpolation
  FinishRegistry.ts           Finish labels, previews, and defaults
  Export*.tsx/ts              Export UI, snapshots, and templates

components/editor/timeline/
  Timeline.tsx                Timeline shell
  useTimelineController.ts    Timeline state and interactions
  ShapePickerContent.tsx      Symbol, preset, and upload picker
  Timeline*                   Clips, tracks, rows, and menus

components/ui/                Shared interface primitives
lib/                          Shared pointer and style utilities
e2e/                          Playwright workflows
```

### Stack

- Next.js 16 and React 19
- Three.js and React Three Fiber-style generated output
- Tailwind CSS 4 and Base UI
- TypeScript, Vitest, Playwright, Oxlint, and Oxfmt

## Current scope

- Projects are local-only; there are no accounts, cloud sync, or collaboration.
- React code export is a strong implementation starter, not a pixel-identical
  replacement for every custom editor shader.
- Android export is a static Filament viewer for the GLB, not an animation
  runtime.
- The editor is optimized for desktop production work, with dedicated Preview,
  Properties, and Timeline views on smaller screens.
