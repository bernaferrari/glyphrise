import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { expect, it, vi } from "vitest"
import {
  DEFAULT_GEOMETRY_SETTINGS,
  DEFAULT_LIGHT_SETTINGS,
  DEFAULT_TRANSFORM_SETTINGS,
} from "../editor/EditorModel"
import { interpolateLightPositionKeyframes } from "../editor/KeyframeInterpolationModel"
import { STATIC_STUDIO_LIGHTING } from "../editor/useLightEditor"
import { FINISH_SPECS } from "./MaterialPresets"
import { exportFilamentGltf } from "./SvgExport"
import type { SvgCanvasProps, SvgExportAnimation } from "./SvgTypes"

it("exports a two-keyframe flowing turn with the same easing as the editor", async () => {
  const snapshot: SvgExportAnimation = {
    duration: 3.6,
    tracks: [],
    extrusionDepth: 10,
    rotationOffset: { x: 0, y: 0, z: 0 },
    rotationAxisKeyframes: [
      { id: "start", time: 0, value: { x: 0, y: 0, z: 0 }, easing: "flow" },
      { id: "end", time: 3.6, value: { x: 0, y: 360, z: 0 }, easing: "flow" },
    ],
    objectScale: 1,
    moveOffset: { x: 0, y: 0, z: 0 },
    moveKeyframes: [],
  }
  let clips: THREE.AnimationClip[] = []
  const parse = vi
    .spyOn(GLTFExporter.prototype, "parse")
    .mockImplementation((_input, _onDone, _onError, options) => {
      clips = options?.animations?.flat() ?? []
      throw new Error("Captured animation")
    })
  try {
    await expect(
      exportFilamentGltf({
        pivotGroup: new THREE.Group(),
        props: {
          ...DEFAULT_GEOMETRY_SETTINGS,
          ...DEFAULT_LIGHT_SETTINGS,
          ...DEFAULT_TRANSFORM_SETTINGS,
          ...STATIC_STUDIO_LIGHTING,
          ...FINISH_SPECS.satin.defaults,
          ...snapshot,
          materialPreset: "satin",
          iconAContent: "",
          iconBContent: "",
          colorA: "#ffffff",
          colorB: "#ffffff",
          wireframe: false,
          transitionType: "cut",
          wipeDirection: { x: 0, y: 0 },
          transitionProgress: 0,
          isPlaying: false,
          zoom: 1,
          exportAnimation: snapshot,
        } satisfies SvgCanvasProps,
        sourceGroups: [],
        applyModelScale: () => {},
      })
    ).rejects.toThrow("Captured animation")
    const rotation = clips[0].tracks.find((track) =>
      track.name.endsWith(".quaternion")
    )!
    for (const fraction of [0.25, 0.75]) {
      const frame = Math.round(snapshot.duration * fraction * 30)
      const time = rotation.times[frame]
      const angle = interpolateLightPositionKeyframes(
        time,
        snapshot.rotationOffset,
        snapshot.rotationAxisKeyframes
      ).y
      const actual = new THREE.Quaternion().fromArray(
        rotation.values,
        frame * 4
      )
      const expected = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        THREE.MathUtils.degToRad(angle)
      )
      expect(actual.angleTo(expected)).toBeLessThan(0.001)
      expect(
        Math.abs(angle - (360 * time) / snapshot.duration)
      ).toBeGreaterThan(15)
    }
  } finally {
    parse.mockRestore()
  }
})
