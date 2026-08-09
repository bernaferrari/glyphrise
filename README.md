# VectorForge

<p align="center">
  <strong>Turn SVG icons into animated, extruded 3D assets—without leaving the browser.</strong>
</p>

![VectorForge editor with a 3D icon, property inspector, and animation timeline](docs/vectorforge-editor.png)

VectorForge is a local-first 3D motion editor for SVG paths and Material
Symbols. Shape an icon, style its material, animate it on a timeline, then
export a GLB, a frame-rendered WebM, or starter implementation code.

> **Project status:** VectorForge is a polished local prototype, not yet a
> hosted collaborative product. Projects live in your browser and exports are
> generated on your device.

## The workflow

1. **Choose a shape** — Search Material Symbols, use a preset, or upload an SVG.
2. **Make it three-dimensional** — Tune extrusion, bevels, transforms, per-path
   depth, materials, and lighting while inspecting the result live.
3. **Add motion** — Arrange shape clips and animate properties with keyframes,
   easing, snapping, and timeline playback.
4. **Hand it off** — Download a GLB or WebM, or copy React Three Fiber and
   Android Filament reference code.

## Highlights

- **Purpose-built 3D viewport** with drag rotation, view nudges, reset controls,
  and a direct transform gizmo.
- **Timeline editor** with shape clips, transitions, property tracks,
  keyframes, easing curves, snapping, zoom, and contextual actions.
- **Material and color tools** for solid colors, mesh gradients, lighting, and
  glass, gel, metal, and cut-style finishes.
- **Per-path SVG control** for visibility, color, depth, and scale in multi-path
  artwork.
- **Safe animation editing** that keeps ordinary static changes separate from
  intentional keyframes.
- **Named local projects** with autosave, templates, recent projects,
  duplication, safe deletion, and portable JSON downloads.
- **Responsive workspace** with compact navigation plus keyboard, touch, and
  reduced-motion considerations.

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

### Your first five minutes

1. Open **Projects** and start with **Example project** to see a finished setup,
   or choose **Blank project** for a clean canvas.
2. Select the icon clip in the timeline and use **Change** to pick a Material
   Symbol or upload your own SVG.
3. Use the inspector tabs to adjust **Style**, **Geometry**, **Transform**, and
   **Light**.
4. Move the playhead, add a property, and create keyframes—or turn on
   **Auto-key** when you want edits to become animation.
5. Choose **Export** to download an asset or inspect the generated starter code.

## Projects and persistence

VectorForge stores named projects in browser storage and autosaves each one
independently. Switching projects flushes pending edits first, and deleting the
current project safely opens another project or creates a fresh fallback.

Use **Download** in the top bar to keep a portable JSON backup. Clearing browser
site data removes projects that have not been downloaded, and local projects do
not automatically sync between browsers or devices.

## Export support

| Target                | Best for                              | Current fidelity                                                                                                                                                                                        |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GLB**               | 3D asset handoff                      | Exports the current icon as a Filament-ready binary glTF asset using compatible geometry and material fields.                                                                                           |
| **WebM**              | Motion previews and rendered delivery | Renders fixed timeline frames from the beginning to the end of the composition.                                                                                                                         |
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

The current automated suite includes 66 unit tests and six Playwright workflows
covering blank and template projects, project duplication/deletion recovery,
custom SVG upload, compact workspace actions, and export messaging.

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
- The editor is optimized for desktop production work, with a compact layout
  for smaller screens.
