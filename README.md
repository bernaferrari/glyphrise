<p align="center">
  <img src="docs/glyphrise-icon.png" alt="Glyphrise app icon: a dimensional pastel G on a midnight-blue tile" width="128" height="128" />
</p>

<h1 align="center">Glyphrise</h1>

<p align="center">
  <strong>Give your icons another dimension.</strong><br />
  Turn flat SVGs into beautiful 3D artwork and motion, right in your browser.
</p>

<p align="center">
  <a href="#get-started">Get started</a> ·
  <a href="#make-your-first-icon">Make your first icon</a> ·
  <a href="#take-it-anywhere">Export options</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

![A rainbow calendar sculpted in 3D, with a soft Pearl finish and live material, shape, transform, and lighting controls](docs/glyphrise-calendar.png)

<p align="center">
  <sub>Made in Glyphrise: Spectrum Mesh color, a Pearl finish, and depth you can shape in real time.</sub>
</p>

An SVG is all you need. Pick an icon or bring your own, give it depth and a
finish, then make it spin, tilt, or pulse. Start with a preset and refine every
keyframe when you want more control.

Glyphrise is built for designers and developers making product illustrations,
animated interface icons, dimensional logos, and motion assets. The workflow
stays focused: **choose → style → animate → export**. No account required.

## Easy to start. Room to go deeper.

- **From flat to dimensional.** Extrude SVG paths, soften edges with bevels,
  and adjust depth, scale, and rotation in a live Three.js viewport.
- **Find your finish.** Try 15 finishes, including satin, chrome, brushed metal,
  holo, glass, gel, toon, and carved graphite. Pair them with solid colors or editable gradients,
  including eight mesh palettes.
- **Motion in a few clicks.** Apply Spin, Tilt, or Pulse, then refine the
  resulting keyframes. Presets affect their own property, so you can combine
  rotation and scale without rebuilding your look.
- **A timeline with real control.** Sequence icon clips, create fades and
  directional wipes, and animate depth, transforms, fills, materials, and
  lighting. Fine-tune timing with easing, snapping, and zoom.
- **Details when you need them.** Edit individual SVG paths, including their
  visibility, color, depth, and scale. Adjust lighting and material settings
  beyond the presets.
- **Keep creating.** Autosave named projects locally, duplicate ideas, undo
  edits, and download portable backups. Use the full desktop workspace or
  dedicated preview, properties, and motion views on smaller screens.

![The Glyphrise workspace with a live 3D preview, finish presets, and staggered rotation, depth, and scale tracks](docs/glyphrise-editor.png)

## Get started

Use **Node.js 24.x** and **pnpm 11.x** for the documented development setup.
The package accepts Node.js 22 or newer.

```bash
git clone https://github.com/bernaferrari/glyphrise.git
cd glyphrise
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The first-run guide takes you from
a starter icon to your first export.

## Make your first icon

1. **Choose your artwork.** Start with Heart, Star, or Bolt in the welcome
   screen. Use **Change icon** in the inspector to browse presets, search
   Material Symbols, or upload an SVG.
2. **Make it yours.** Try a finish swatch, choose a color or gradient, and
   adjust **Depth** and **Edge roundness**. Changes appear in the preview.
3. **Add motion.** Choose **Add animation** in the timeline. Pick **Spin** or
   **Tilt** under Rotation, or **Pulse** under Scale. Add another property
   to layer in more motion; drag the keyframe diamonds to change the timing.
4. **Preview and download.** Press **Play**, then **Export**. Choose an image,
   video, 3D asset, or implementation starter.

The [Calendar sample project](docs/calendar-motion.glyphrise.json) recreates the Pearl calendar look and adds three staggered animation tracks, each
with only start and end keyframes, plus a Calendar → Calendar Off wipe.
Save the JSON file, then choose **Open from computer** from the file menu
to explore it yourself.

On smaller screens, switch between **Preview**, **Properties**, and **Motion**.
The workspace actions menu also provides **Animate** and project tools.

### A few controls worth knowing

| Action                           | Control                                                  |
| -------------------------------- | -------------------------------------------------------- |
| Orbit the preview camera         | Drag the preview                                         |
| Zoom the preview                 | Scroll over the preview                                  |
| Reset the view and object pose   | **Reset view** in the preview toolbar                    |
| Change the object in your export | Inspector **Transform** controls or **Transform object** |
| Play or pause                    | **Play**, or `Space` when the workspace has focus        |
| Undo / redo                      | `⌘/Ctrl Z` / `⌘/Ctrl Shift Z`                            |
| Edit a keyframe precisely        | Double-click its diamond                                 |

Camera orbit and zoom affect the preview only. Use object transforms to change
the pose in your exported asset.

The inspector tells you whether an edit applies to the **entire animation**,
updates a **keyframe**, or **adds a keyframe at the playhead**. Once a property
has animation, editing it at a new time creates a keyframe there. Properties
without keyframes keep one value throughout.

## Take it anywhere

Render finished artwork or take the geometry and starter code into your app.

| Output                | What you get                                          | What to know                                                                                                                                                        |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PNG**               | A still render with a transparent or solid background | Explicit dimensions up to 4096 px per side; editor guides and selection outlines are excluded.                                                                      |
| **WebM / MP4**        | The full animated timeline                            | Choose dimensions, quality, background, and 24, 30, or 60 fps. Available formats and transparency depend on the browser and codec.                                  |
| **GLB**               | An editable glTF binary asset                         | Includes compatible geometry, PBR materials, and supported transform/depth animation. Wipes and custom editor shaders are omitted.                                  |
| **React Three Fiber** | A generated component as an implementation starter    | Preserves timing, transforms, wipes, per-path edits, animated lighting, and standard PBR settings. Mesh gradients, custom finishes, and crown roofs are simplified. |
| **Android Filament**  | Gradle and Kotlin code for viewing the exported GLB   | A static viewer starter; editor timeline playback is not reproduced.                                                                                                |

For the Android sample, place the exported GLB at
`app/src/main/assets/exports/icon.glb`. Verify generated code and material
appearance in your target runtime before shipping.

## Your projects, on your device

Glyphrise is a local-first prototype. Named projects autosave in browser
storage, and rendering and exports run on your device. There are no accounts,
cloud sync, or collaboration features in the current release.

Open the menu beside the project name to create, switch, duplicate, or delete
projects. Choose **Download backup** to save a portable JSON copy, and
**Import project file** to restore one. **Clearing browser site data removes
local projects**, so download backups for work you want to keep or move to
another device.

### SVG and browser compatibility

For predictable imports, use a plain SVG with a `viewBox` and explicit paths.
Outline text, expand strokes, and flatten effects before exporting from your
vector editor. Common paths, groups, fills, and transforms are supported;
filters, masks, complex clip paths, embedded images, external fonts, and
`foreignObject` content can be unsupported or unreliable. Imported SVGs are
sanitized before use.

Use a browser with **WebGL2** support. Desktop provides the most room for
precise timeline work; smaller screens offer preview, styling, simple edits,
and playback. Video export checks the browser's codec support before offering
WebM or MP4. Loading Material Symbols and web fonts requires network access.

## Development

Built with **Next.js 16**, **React 19**, **Three.js**, **TypeScript**,
**Tailwind CSS 4**, and **Base UI**. React Three Fiber is a generated export
target; the editor viewport uses Three.js directly.

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Start the development server                     |
| `pnpm test`         | Run Vitest unit tests                            |
| `pnpm test:e2e`     | Run Playwright editor workflows; requires Chrome |
| `pnpm typecheck`    | Check TypeScript                                 |
| `pnpm lint`         | Run Oxlint                                       |
| `pnpm format:check` | Check formatting with Oxfmt                      |
| `pnpm build`        | Create a production build                        |
| `pnpm start`        | Serve the production build                       |

Tests cover project lifecycle and persistence, SVG import and geometry,
keyframes and interpolation, undo, export behavior, and desktop and touch
workflows. Run the checks above before submitting changes.

### Where things live

| Directory                                                    | Responsibility                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [`app/`](app/)                                               | Entry point, layout, fonts, and theme styles                           |
| [`components/3d/`](components/3d/)                           | SVG geometry, materials, lighting, viewport interaction, and rendering |
| [`components/editor/`](components/editor/)                   | Project state, inspector, history, animation, and export               |
| [`components/editor/timeline/`](components/editor/timeline/) | Icon clips, property tracks, keyframes, and timeline interaction       |
| [`components/ui/`](components/ui/)                           | Shared controls and color editors                                      |
| [`e2e/`](e2e/)                                               | Playwright user workflows                                              |

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE) · Copyright © 2026 Bernardo Ferrari.
