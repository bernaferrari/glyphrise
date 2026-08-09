# VectorForge

<p align="center">
  <strong>VectorForge turns SVG icons into animated extruded 3D assets.</strong>
</p>

VectorForge is a browser-based 3D motion editor for SVG paths and Material
Symbols. It gives designers and engineers one focused workspace for choosing an
icon, shaping its extrusion, tuning materials, animating motion, and exporting a
runtime-ready result.

Instead of moving between separate SVG, 3D, and motion tools, VectorForge keeps
the core workflow in three synchronized surfaces:

- **Viewport** - inspect the 3D icon, drag to rotate, nudge the view, and use
  direct transform controls.
- **Inspector** - adjust fill, finish, extrusion, bevel, transform, lighting,
  and layer settings.
- **Timeline** - build shape sequences, transitions, property tracks,
  keyframes, easing, and playback.

Everything runs locally in a Next.js app. Named projects autosave separately on
the device and can be downloaded as portable JSON files. Exports include exact
GLB assets and WebM recordings, plus clearly labeled React Three Fiber starter
code and a static Android Filament viewer reference.

## Why VectorForge

Small 3D app icons sit in an awkward place. SVG tools are great for paths, video
tools are built for timelines, and full 3D suites are heavy for icon-sized
assets.

VectorForge is built for that middle step. Start with an SVG or Material Symbol,
extrude it, make it feel tactile, animate the useful parts, then hand off an
asset and implementation reference without rebuilding the motion from scratch.

## Features

- **SVG extrusion** - Convert SVG paths into bounded Three.js geometry with
  safe depth, bevel, and crown settings.
- **Material Symbols picker** - Search and import Google Material Symbols, with
  support for slash/unslash wipe pairs.
- **3D viewport** - Rotate by dragging, reset the view, use orientation nudges,
  and manipulate transforms with a viewport gizmo.
- **Timeline editor** - Create shape clips, transitions, property rows,
  keyframes, easing curves, snapping, zooming, and contextual actions.
- **Inspector controls** - Edit static values without accidentally creating
  animation data; add keyframes only when a property should animate.
- **Color and finish tools** - Use solid colors, mesh gradients, lighting, and
  finish presets such as glass, gel, metal, and cut styles.
- **SVG path editing** - Select visibly named SVG paths, override visibility,
  and tune per-path depth and scale for multi-path symbols.
- **Project workflow** - Create blank, example, or style-based projects, rename
  them, reopen or duplicate recent local work, safely delete local projects,
  and download portable project files.
- **Export workflow** - Record WebM, export GLB-oriented assets, and copy React
  Three Fiber starter code or a static Android Filament viewer. Code exports
  preserve SVG path colors and disclose the finish and gradient effects they
  simplify.

## Get Started

Requires [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/bernaferrari/vectorforge
cd vectorforge
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the quality checks before shipping changes:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test:e2e
```

The end-to-end smoke tests use the installed Google Chrome browser and cover
blank-project creation, compact workspace navigation, and export labeling.

## Architecture

```text
app/
  page.tsx                    Editor entry point
  layout.tsx                  App shell, fonts, and providers
  globals.css                 Tailwind theme tokens

components/3d/
  SvgCanvas.tsx               Three.js viewport boundary
  SvgModelBuilder.ts          Builds renderable icon groups
  SvgShapeGeometry.ts         SVG-to-extruded-geometry pipeline
  StraightSkeleton.ts         Medial roof geometry for cut finishes
  MaterialPresets.ts          Three.js material presets and shaders
  TransformGizmo*.ts          Direct transform controls

components/editor/
  AppLayout.tsx               Editor composition
  EditorModel.ts              Shared editor data model
  ShapeSequenceModel.ts       Shape clips and transitions
  TimelineModel.ts            Time, tracks, keyframes, and interpolation
  FinishRegistry.ts           Finish labels, previews, and defaults
  Export*.tsx/ts              Export UI, snapshots, and code templates

components/editor/timeline/
  Timeline.tsx                Timeline shell
  useTimelineController.ts    Timeline state and interactions
  ShapePickerContent.tsx      Symbol, preset, and upload picker
  Timeline*                  Tracks, clips, rows, keyframes, and menus

components/ui/
  button/dialog/tabs/...      shadcn-style primitives
  color-picker.tsx            Solid and mesh color picker

lib/
  drag-events.ts              Shared pointer drag helpers
  utils.ts                    Tailwind class merging
```

## Export Targets

VectorForge currently supports:

- **WebM recording** for quick motion previews.
- **GLB export** for 3D asset handoff.
- **React Three Fiber snippets** for web implementation reference.
- **Android Filament snippets** for loading the exported GLB in an Android app.

The Android sample expects exported assets at:

```text
app/src/main/assets/exports/icon.glb
```

## Product Principles

- Keep the viewport, inspector, and timeline in sync.
- Do not create animation data from ordinary static edits.
- Keep controls compact enough for repeated production use.
- Prefer pure model helpers for timeline math, geometry safety, color editing,
  and material state.
- Keep exported materials close to standard glTF PBR fields whenever possible.

## Status

VectorForge is an active editor prototype moving toward a polished production
workflow. The current focus is geometry reliability, intuitive timeline editing,
clean exports, and keeping the UI compact without hiding important controls.
