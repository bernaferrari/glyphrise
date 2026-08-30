# Glyphrise

<p align="center">
  <strong>Turn SVG icons into polished 3D motion.</strong>
</p>

![Glyphrise editor with a 3D icon, property inspector, and animation timeline](docs/glyphrise-editor.png)

Glyphrise turns flat SVG artwork and Material Symbols into polished 3D motion.
Choose an icon or upload your own, apply a finish, animate it, and export the
result—all in the browser.

It is designed for product designers, motion designers, and developers who want
the speed of a generator with the control of an editor—without learning a full
3D suite.

> **Project status:** Glyphrise is a polished local-first prototype. Projects
> are stored in your browser and exports are generated on your device. Accounts,
> cloud sync, and real-time collaboration are not part of the current release.

## What you can make

- Animated 3D product and interface icons
- Extruded logos and SVG marks
- Material and lighting studies
- Transparent or solid-background PNG stills
- Short WebM or MP4 motion assets when the browser supports the codec
- GLB assets for web and Android projects
- React Three Fiber and Android Filament implementation starters

## The workflow

1. **Choose an icon** — Search Material Symbols, start from a preset, or upload
   your own SVG.
2. **Give it depth** — Adjust extrusion, bevels, transforms, per-path geometry,
   materials, and lighting in the live 3D viewport.
3. **Bring it to life** — Sequence icon clips and animate properties with
   keyframes, easing, snapping, and timeline playback.
4. **Export it** — Render a PNG, WebM, or MP4 at a stable size and frame rate;
   download a GLB; or copy starter code for React Three Fiber and Android
   Filament.

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
git clone <your-glyphrise-repository-url> glyphrise
cd glyphrise
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Create your first animated 3D icon

1. Open the top bar and choose **Projects on this device**.
2. Start with **Use example** to explore a finished composition, or choose
   **Start blank** for a clean canvas.
3. Select the icon clip and choose **Change** to search Material Symbols or
   upload an SVG.
4. Use **Style**, **Geometry**, **Transform**, and **Light** to shape the result.
5. Move the playhead and add keyframes, or enable **Auto-key** before adjusting
   animated properties.
6. Choose **Export** to download the asset or inspect implementation code.

## Projects and persistence

Glyphrise stores named projects in browser storage and autosaves each one
independently. Switching projects flushes pending edits first, and deleting the
current project safely opens another project or creates a fresh fallback.

Use **Project → Download backup** to keep a portable JSON copy. Clearing browser
site data removes projects that have not been downloaded, and local projects do
not automatically sync between browsers or devices.

## Export support

| Target                | Best for                              | Current fidelity                                                                                                                                                                                        |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PNG**               | Still artwork and product graphics    | Renders at an explicit size up to 4096 px per side with a transparent or solid background. Editor guides and selection outlines are excluded.                                                           |
| **WebM / MP4**        | Motion previews and rendered delivery | Renders the full timeline at 24, 30, or 60 fps with explicit dimensions, quality, and background. Only formats verified by the current browser are offered.                                             |
| **GLB**               | 3D asset handoff                      | Exports the current icon as a Filament-ready glTF asset with supported transform and depth animation. Wipes and custom editor shaders are not encoded.                                                  |
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

The current automated suite includes more than 75 unit tests and nine Playwright workflows
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

## Positioning

> **Choose an icon or upload your own. Apply a finish, animate it, and export it.**

Glyphrise is focused on the icon-to-3D-motion workflow: fast enough to generate,
flexible enough to edit. It is not a general-purpose modeller, character
animation tool, or collaborative design suite.

## SVG compatibility

Glyphrise accepts sanitized SVG files and converts supported paths into extruded
3D geometry. For the most predictable result, export a plain SVG with explicit
`path` elements, a `viewBox`, and fills/strokes converted to paths.

Supported workflows include Material Symbols, ordinary SVG paths, groups, fills,
and common transforms. Unsupported or unreliable constructs include embedded
HTML/`foreignObject`, text that has not been outlined, external image or font
references, CSS-dependent effects, filters, masks, and complex clip paths.

If an import fails, outline text, expand strokes, remove external references,
flatten filters/masks, and re-export as a plain SVG. Imported content is
sanitized locally; scripts and unsafe external references are not executed.

## Browser support

Glyphrise targets current desktop Chrome, Edge, Firefox, and Safari releases
with WebGL2, pointer events, and MediaRecorder support. Desktop is the intended
precision environment. Current mobile Safari and Chrome support Preview,
Properties, finishing, simple edits, and playback; advanced timeline editing is
more comfortable on a larger screen. Glyphrise checks WebM and MP4 codec
support before offering either video format.

## Export fidelity

| Output            | Fidelity                                                         | Important limitations                                                    |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| PNG               | Exact still render at explicit dimensions                        | Not editable after export                                                |
| WebM / MP4        | Full timeline render at explicit dimensions and frame rate       | Codec and alpha-channel support vary by browser                          |
| GLB               | High for compatible extruded geometry and standard PBR materials | Wipes, custom shaders, and some appearance animation are omitted         |
| React Three Fiber | Strong implementation starter                                    | Requires project-side shader/material tuning for pixel-identical results |
| Android Filament  | Static GLB viewer starter                                        | Does not include timeline playback or editor-only effects                |

Generated code is a starting point; verify final output in the target runtime.
