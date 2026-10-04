# Local usability review — September 7, 2026

## October 2 timeline redesign

The separate Sequence and Motion tabs were two partial editors for the same
data. They are now one timeline, laid out like a video editor: a toolbar
holds Add, Record (auto-key), transport with an editable timecode, snapping,
loop, and zoom. Below it, an icon track shows clips and transitions, with one
lane per animated property. Each property header has an After Effects-style
‹ ◆ › keyframe navigator. Double-clicking a keyframe (or tapping a selected one)
opens its time, easing, and value editor. Clicking an icon clip selects it and
moves the playhead; double-clicking changes the icon. The preview no longer
duplicates the transport while the timeline is visible. On desktop,
Record moved from the inspector footer to the timeline.

## October 2 follow-up

The current first-use flow offers Heart, Star, and Bolt starters. Creating one
opens a saved, editable project with a single icon and no inherited animation.
A dismissible creation card follows styling, applying motion, playing it, and
completing a real asset download. Returning projects open directly in the
workspace; Getting started remains available from the toolbar or phone menu.

The duplicate toolbar Auto-key control has been removed. Record edits lives
beside the inspector, with an explanation of saved animation moments. Export
now starts with Image, Video, and 3D model choices and one named download action.
Custom dimensions, frame rate, and quality remain under More settings; code
exports and the fidelity matrix are secondary surfaces. Success feedback stays
visible after an export instead of disappearing after two seconds.

The first-creation browser checks cover fresh phone and desktop sessions,
styling, adjustable motion, playback, a real PNG download, reload recovery, and
a real short video download, cancellation on close, and reachable actions at
320 × 568. These are automated checks. No first-time
participant study has been completed. Human validation remains outstanding.

## September 7 expert walkthrough

**Verdict: Approve with changes.** Creating and styling an icon is approachable,
with immediate visual feedback and a clear Export action. Animation is the
steepest part of the learning curve: a new user encounters clips, property
tracks, keyframe diamonds, and auto-key before understanding their relationship.
This was an expert walkthrough, not a study with first-time users.

## Method

Ran the Next.js app locally and interacted with it through Chrome using
Playwright. Inspected desktop screenshots at 1440 × 900 and the compact layout
at 390 × 568. Exercised icon picking, keyboard activation, quick-start links,
property controls, and export. The existing browser suite additionally covered
project creation, duplication, deletion, SVG upload, reload persistence, canvas
rotation/undo, compact navigation, and export settings.

## Findings and refinements

| Priority | Observed friction                                                                                      | Change                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Space on the focused Change icon button also started playback.                                         | Preserve controls' native Space handling and suspend editor shortcuts while dialogs are mounted. Workspace Space still toggles playback.                    |
| High     | Preview controls painted over the phone Properties view, even though the preview was inert.            | Give the preview its own stacking context so its controls stay below the inspector.                                                                         |
| High     | The quick-start guide stayed above the controls its Style link opened on a phone.                      | Collapse the guide when opening Style or Motion. Keep its reopen chip off the Properties and Timeline panes; help remains available from workspace actions. |
| Medium   | The selected icon name disappeared at desktop width and was severely truncated on a phone.             | Separate identity from actions, with navigation aligned on the actions row. Increase Add/Change target height.                                              |
| Medium   | Presets and Wipe pairs displayed “Search symbols”; Enter could invoke a symbol import from those tabs. | Match search labels and available actions to the active library. Typed symbol imports are confined to Symbols.                                              |
| Medium   | Fixed-height picker content could be clipped on short screens.                                         | Allow tab content to scroll, including upload instructions, and use 16px search text on small screens.                                                      |
| Medium   | Geometry labels appeared as “Edge roundne…” and “Curve smooth…”.                                       | Let property labels wrap within the shared label column.                                                                                                    |

## What works well

- Immediate 3D feedback makes experimenting with depth, fills, and finishes rewarding.
- Export is prominent, and its settings explain the output size and format.
- Project management, reload persistence, and gesture-level undo passed browser checks.
- Dedicated phone workspace views keep the page within the viewport.
- PNG export produced a valid file with the requested 256 × 256 dimensions.

## Completed workflow refinement

The follow-up implementation addresses all five proposed improvements:

- A persistent **Choose icon → Style → Animate → Export** workflow provides a
  direct path through the editor. Animate offers preview tiles for Spin, Tilt,
  and Pulse, with duration and intensity controls. Applying a preset replaces
  only its rotation or scale keyframes and can be undone in one step.
- The inspector describes edit scope at the current time and places an Auto-key
  switch beside the explanation. It distinguishes an existing keyframe from a
  position between keyframes, where base edits do not override animation.
- Timeline sections now read **Icon sequence** and **Animated properties**.
  Diamond controls name the property and time. Add property starts a gentle
  animation with a beginning, midpoint, and return, so it immediately plays.
- Preview dragging orbits a separate camera. Reset camera restores its view and
  zoom without touching object transforms or undo. Transform controls remain
  explicit. Camera orbit and zoom are excluded from rendered exports.
- Onboarding is a compact, dismissible instruction strip. It progresses from
  choosing and styling an icon to motion, Play, and Export. It can be reopened
  through Quick start. Motion preview tiles and camera reset/nudges respect
  reduced-motion preferences.

The compact workspace is still intended for simpler edits. This is an expert
walkthrough and automated browser validation, not a first-time-user study or
an accessibility certification. Real iOS/Android testing and observation of
new users remain valuable validation work.

## Validation

- 118 unit tests passed.
- All 11 existing browser workflows passed.
- Browser regressions cover keyboard activation, preset search, selected icon
  readability, phone layering/onboarding, and a real PNG download.
- Added workflow checks for adjustable presets, artwork preservation, one-step
  undo, intentional Auto-key editing, starter property animations, preview-only
  camera changes, and the phone motion-to-export flow with reduced motion.
- Type checking, lint, formatting, and the production build passed.

Existing project-lifecycle edits in the working tree were preserved.

## Simplification after user feedback

Removed the inspector’s Style/Geometry/Transform/Light navigation row, which
looked like tabs but only scrolled through visible sections. The section headings
and controls remain. Also removed the numbered workflow bar and contextual
instruction strip. Animate is now a regular toolbar action alongside Export,
available on desktop and compact screens.

The icon card now separates Change/Add actions from labeled navigation (Icon 1
of 2), and drops redundant SVG metadata. Auto-key is a compact switch with
context and optional help. Removed the finish-description paragraph and the
read-only Preview quality label; Curve smoothness remains directly editable.
Space on the timeline playhead now prevents scrolling and toggles playback once
per press, while text fields and focused controls retain their normal behavior.
Hide/Show panels now uses a short eased View Transition, with an immediate
fallback for reduced motion and browsers without View Transition support.
