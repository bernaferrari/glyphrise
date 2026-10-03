import * as THREE from "three"

export type MaterialPresetId =
  | "matte"
  | "satin"
  | "gloss"
  | "pearl"
  | "velvet"
  | "chrome"
  | "brushed"
  | "holo"
  | "prism"
  | "frost"
  | "glass"
  | "gel"
  | "neon"
  | "xray"
  | "toon"
  | "carved"
  | "carvedInner"
  | "carvedOuter"
  | "carvedSoft"

export interface MaterialProps {
  color: string
  roughness: number
  metalness: number
  reflectance: number
  emissive: string
  emissiveIntensity: number
  opacity: number
  wireframe: boolean
  clearcoat: number
  clearcoatRoughness: number
  transmission: number
  thickness: number
  ior: number
  map?: THREE.Texture | null
  vertexColors?: boolean
}

export type FinishSettings = Pick<
  MaterialProps,
  | "roughness"
  | "metalness"
  | "reflectance"
  | "clearcoat"
  | "clearcoatRoughness"
  | "transmission"
  | "thickness"
  | "emissiveIntensity"
>

type ShaderEffectId =
  | "pearl"
  | "holo"
  | "prism"
  | "glass"
  | "frost"
  | "gel"
  | "neon"
  | "xray"
  | "toon"
  | "carved"
  | "carvedInner"
  | "carvedOuter"

/**
 * A color grade applied to the fill before lighting: pull toward a color,
 * then adjust saturation and brightness. It runs per pixel for gradients and
 * textures, so a finish looks the same on every kind of fill.
 */
type FinishGrade = {
  mix?: { color: string; amount: number }
  saturation?: number
  brightness?: number
}

type FinishSpec = {
  model: "standard" | "physical" | "toon"
  defaults: FinishSettings
  grade?: FinishGrade
  /** Ignores the fill entirely (graphite carvings). */
  fixedColor?: string
  emissiveFloor?: number
  metalnessCap?: number
  ior?: number
  /**
   * Frosted materials blend with what is behind them; clear ones rely on
   * transmission alone and stay depth-sorted like solids; additive ones add
   * light on top of the scene without hiding anything.
   */
  translucency?: "frosted" | "clear" | "additive"
  /** Light passing through takes on the fill color over this distance. */
  attenuationDistance?: number
  sheen?: { amount: number; roughness: number; color: string; fillMix?: number }
  iridescence?: { amount: number; ior: number; range: [number, number] }
  anisotropy?: { amount: number; rotation: number }
  /** envMapIntensity = max(floor, reflectance * scale). */
  env?: { floor: number; scale: number }
  /** Scales the key light so dark and bright finishes read at equal weight. */
  light: number
  shader?: ShaderEffectId
  carve?: { profile: "center" | "inset" | "outer"; mode: "medial" | "native" }
}

const settings = (
  roughness: number,
  metalness: number,
  reflectance: number,
  clearcoat: number,
  clearcoatRoughness: number,
  transmission: number,
  thickness: number,
  emissiveIntensity: number
): FinishSettings => ({
  roughness,
  metalness,
  reflectance,
  clearcoat,
  clearcoatRoughness,
  transmission,
  thickness,
  emissiveIntensity,
})

const CARVED_BASE = {
  model: "physical",
  fixedColor: "#2f3031",
  sheen: { amount: 0.42, roughness: 0.54, color: "#e5e7eb" },
  env: { floor: 0.42, scale: 1.4 },
  light: 0.95,
} as const satisfies Partial<FinishSpec>

export const FINISH_SPECS: Record<MaterialPresetId, FinishSpec> = {
  matte: {
    model: "standard",
    defaults: settings(1, 0, 0.04, 0, 0.8, 0, 0.35, 0.02),
    grade: { saturation: 0.78, brightness: 0.9 },
    light: 0.9,
  },
  satin: {
    model: "physical",
    defaults: settings(0.34, 0.04, 0.7, 0.3, 0.38, 0, 0.4, 0.07),
    sheen: { amount: 0.45, roughness: 0.4, color: "#ffffff", fillMix: 0.6 },
    light: 1.08,
  },
  gloss: {
    model: "physical",
    defaults: settings(0.2, 0, 0.72, 1, 0.03, 0, 0.5, 0.04),
    grade: { saturation: 1.2 },
    env: { floor: 0.9, scale: 1.2 },
    light: 1.2,
  },
  pearl: {
    model: "physical",
    defaults: settings(0.42, 0, 0.86, 0.72, 0.22, 0, 0.6, 0.035),
    grade: { mix: { color: "#ffffff", amount: 0.35 }, brightness: 1.05 },
    sheen: { amount: 0.8, roughness: 0.36, color: "#c4b5fd", fillMix: 0.48 },
    light: 1.35,
    shader: "pearl",
  },
  velvet: {
    model: "physical",
    defaults: settings(0.95, 0, 0.18, 0, 0.6, 0, 0.4, 0.03),
    grade: { saturation: 1.25, brightness: 0.55 },
    sheen: { amount: 1, roughness: 0.28, color: "#ffffff", fillMix: 0.3 },
    light: 1.15,
  },
  chrome: {
    model: "physical",
    defaults: settings(0.075, 0.48, 1, 1, 0.02, 0, 0.4, 0.08),
    grade: { mix: { color: "#ffffff", amount: 0.18 }, saturation: 0.75 },
    emissiveFloor: 0.08,
    metalnessCap: 0.52,
    sheen: { amount: 0.35, roughness: 0.18, color: "#ffffff" },
    env: { floor: 1.8, scale: 2.4 },
    light: 2.35,
  },
  brushed: {
    model: "physical",
    defaults: settings(0.34, 0.92, 0.9, 0.35, 0.3, 0, 0.4, 0.04),
    grade: { mix: { color: "#ffffff", amount: 0.12 }, saturation: 0.85 },
    anisotropy: { amount: 0.85, rotation: Math.PI / 2 },
    env: { floor: 1.4, scale: 1.9 },
    light: 1.9,
  },
  holo: {
    model: "physical",
    defaults: settings(0.16, 0.02, 0.85, 1, 0.08, 0, 0.5, 0.12),
    grade: { mix: { color: "#ffffff", amount: 0.3 } },
    metalnessCap: 0.08,
    sheen: { amount: 0.6, roughness: 0.24, color: "#f0abfc" },
    iridescence: { amount: 1, ior: 2.2, range: [260, 920] },
    env: { floor: 0.9, scale: 1.15 },
    light: 1.28,
    shader: "holo",
  },
  prism: {
    model: "physical",
    defaults: settings(0.035, 0.68, 1, 1, 0.01, 0, 0.45, 0.14),
    grade: { mix: { color: "#020617", amount: 0.82 } },
    emissiveFloor: 0.14,
    metalnessCap: 0.74,
    sheen: { amount: 0.62, roughness: 0.08, color: "#67e8f9" },
    iridescence: { amount: 0.78, ior: 2.15, range: [120, 920] },
    env: { floor: 2.6, scale: 3.2 },
    light: 2.85,
    shader: "prism",
  },
  frost: {
    model: "physical",
    defaults: settings(0.6, 0, 0.7, 0.3, 0.5, 0.5, 1.2, 0.035),
    grade: { mix: { color: "#ffffff", amount: 0.25 } },
    attenuationDistance: 1.6,
    ior: 1.42,
    translucency: "frosted",
    sheen: { amount: 0.7, roughness: 0.5, color: "#ffffff" },
    light: 1.15,
    shader: "frost",
  },
  glass: {
    model: "physical",
    defaults: settings(0.04, 0, 0.8, 1, 0.04, 0.9, 1, 0),
    grade: { mix: { color: "#ffffff", amount: 0.3 } },
    attenuationDistance: 0.9,
    ior: 1.52,
    translucency: "clear",
    env: { floor: 1.2, scale: 1.5 },
    light: 1.65,
    shader: "glass",
  },
  gel: {
    model: "physical",
    defaults: settings(0.12, 0, 0.92, 1, 0.05, 0.6, 1.6, 0.4),
    grade: { saturation: 1.3 },
    attenuationDistance: 0.45,
    ior: 1.44,
    translucency: "clear",
    env: { floor: 1.45, scale: 1.75 },
    light: 1.8,
    shader: "gel",
  },
  neon: {
    model: "standard",
    defaults: settings(0.28, 0, 0.34, 0, 0.2, 0, 0.35, 0.82),
    grade: { saturation: 1.2 },
    light: 0.78,
    shader: "neon",
  },
  xray: {
    model: "standard",
    defaults: settings(0.4, 0, 0.3, 0, 0.2, 0, 0.35, 1),
    grade: { mix: { color: "#000000", amount: 0.7 } },
    translucency: "additive",
    light: 0.8,
    shader: "xray",
  },
  toon: {
    model: "toon",
    defaults: settings(1, 0, 0, 0, 0, 0, 0.4, 0),
    grade: { saturation: 1.15 },
    light: 1.1,
    shader: "toon",
  },
  carved: {
    ...CARVED_BASE,
    defaults: settings(0.76, 0, 0.46, 0.12, 0.58, 0, 0.4, 0.045),
    shader: "carved",
    carve: { profile: "center", mode: "medial" },
  },
  carvedInner: {
    ...CARVED_BASE,
    defaults: settings(0.78, 0, 0.5, 0.1, 0.62, 0, 0.4, 0.055),
    shader: "carvedInner",
    carve: { profile: "inset", mode: "medial" },
  },
  carvedOuter: {
    ...CARVED_BASE,
    defaults: settings(0.72, 0, 0.58, 0.18, 0.46, 0, 0.4, 0.05),
    shader: "carvedOuter",
    carve: { profile: "outer", mode: "medial" },
  },
  carvedSoft: {
    ...CARVED_BASE,
    defaults: settings(0.82, 0, 0.42, 0.08, 0.7, 0, 0.4, 0.035),
    shader: "carved",
    carve: { profile: "center", mode: "native" },
  },
}

export const finishDefaultSettings = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].defaults

export const isMaterialPresetId = (value: string): value is MaterialPresetId =>
  Object.hasOwn(FINISH_SPECS, value)

/** Finishes that let the background show through. */
export const isTranslucentFinish = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].translucency !== undefined

export const isAdditiveFinish = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].translucency === "additive"

/** Finishes that emit their own light, so previews show a halo. */
export const isGlowingFinish = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].defaults.emissiveIntensity >= 0.3

export const isGraphiteCutPreset = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].carve !== undefined

export const finishCarve = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].carve ?? null

export const finishLightMultiplier = (preset: MaterialPresetId) =>
  FINISH_SPECS[preset].light

export const finishEnvMapIntensity = (
  preset: MaterialPresetId,
  reflectance: number
) => {
  const env = FINISH_SPECS[preset].env
  return env ? Math.max(env.floor, reflectance * env.scale) : reflectance
}

export const finishMetalness = (
  preset: MaterialPresetId,
  metalness: number
) => {
  const cap = FINISH_SPECS[preset].metalnessCap
  return cap === undefined ? metalness : Math.min(metalness, cap)
}

export const finishEmissiveIntensity = (
  preset: MaterialPresetId,
  intensity: number
) => Math.max(intensity, FINISH_SPECS[preset].emissiveFloor ?? 0)

type ShaderDecorator = NonNullable<THREE.Material["onBeforeCompile"]>

/**
 * Layers shader edits. The cache key includes every previous layer, so a
 * material with surface emission never shares a program with one without.
 */
const chainBeforeCompile = <T extends THREE.Material>(
  material: T,
  cacheKey: string,
  decorator: ShaderDecorator
): T => {
  const previousBeforeCompile = material.onBeforeCompile
  const previousCacheKey = material.customProgramCacheKey.bind(material)

  material.onBeforeCompile = (shader, renderer) => {
    previousBeforeCompile.call(material, shader, renderer)
    decorator(shader, renderer)
  }
  material.customProgramCacheKey = () => `${previousCacheKey()}|${cacheKey}`
  return material
}

const applySurfaceEmissive = <T extends THREE.Material>(
  material: T,
  intensity: number
): T => {
  if (intensity <= 0) return material

  const surfaceEmissiveUniform = { value: intensity }
  material.userData.surfaceEmissiveUniform = surfaceEmissiveUniform
  return chainBeforeCompile(material, "surface-emissive", (shader) => {
    shader.uniforms.surfaceEmissiveIntensity = surfaceEmissiveUniform
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float surfaceEmissiveIntensity;"
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * surfaceEmissiveIntensity;"
      )
  })
}

const LUMA = [0.2126, 0.7152, 0.0722] as const

/** The JS twin of the grade shader, for solid fills. */
const gradeColor = (color: THREE.Color, grade: FinishGrade) => {
  const graded = color.clone()
  if (grade.mix) graded.lerp(new THREE.Color(grade.mix.color), grade.mix.amount)
  const luma = graded.r * LUMA[0] + graded.g * LUMA[1] + graded.b * LUMA[2]
  const saturation = grade.saturation ?? 1
  const brightness = grade.brightness ?? 1
  graded.r = Math.max(0, luma + (graded.r - luma) * saturation) * brightness
  graded.g = Math.max(0, luma + (graded.g - luma) * saturation) * brightness
  graded.b = Math.max(0, luma + (graded.b - luma) * saturation) * brightness
  return graded
}

const glsl = (value: number) => value.toFixed(4)

const addSurfaceGrade = <T extends THREE.Material>(
  material: T,
  grade: FinishGrade
): T => {
  const mix = grade.mix
    ? (() => {
        const color = new THREE.Color(grade.mix.color)
        return `graded = mix(graded, vec3(${glsl(color.r)}, ${glsl(color.g)}, ${glsl(color.b)}), ${glsl(grade.mix.amount)});`
      })()
    : ""
  const code = `vec3 graded = diffuseColor.rgb;
${mix}
float gradedLuma = dot(graded, vec3(${LUMA.join(", ")}));
graded = max(vec3(gradedLuma) + (graded - gradedLuma) * ${glsl(grade.saturation ?? 1)}, 0.0);
diffuseColor.rgb = graded * ${glsl(grade.brightness ?? 1)};`
  return chainBeforeCompile(
    material,
    `grade-${JSON.stringify(grade)}`,
    (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>\n${code}`
      )
    }
  )
}

type ShaderEffect = { after: string; code: string; common?: string }

const VIEW_FACING = "abs(dot(normal, normalize(vViewPosition)))" // 1 facing the camera, 0 at the rim

const SPECTRAL_BANDS = `vec3 elevatedBandColor(float band) {
  vec3 cyan = vec3(0.0, 0.78, 1.0);
  vec3 blue = vec3(0.0, 0.24, 1.0);
  vec3 magenta = vec3(1.0, 0.02, 0.78);
  vec3 amber = vec3(1.0, 0.46, 0.02);
  vec3 lime = vec3(0.36, 1.0, 0.58);
  vec3 cool = mix(cyan, blue, smoothstep(0.08, 0.42, band));
  vec3 warm = mix(amber, magenta, smoothstep(0.36, 0.78, band));
  return mix(cool, warm, smoothstep(0.28, 0.88, fract(band + 0.16))) + lime * smoothstep(0.78, 0.96, band) * 0.22;
}`

const ELEVATED_FRAME = `vec3 elevatedViewDir = normalize(vViewPosition);
float elevatedFacing = clamp(1.0 - abs(dot(normal, elevatedViewDir)), 0.0, 1.0);
float elevatedVertical = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
float elevatedBand = fract(elevatedFacing * 1.85 + elevatedVertical * 0.72 + normal.x * 0.18);
float elevatedRim = pow(elevatedFacing, 3.2);
float elevatedSide = pow(clamp(1.0 - normal.z * 0.5 - 0.5, 0.0, 1.0), 1.4);`

/** Machined graphite: face-angle shading, a pale rim, and fine grain. */
const carvedEffect = (
  profile: "center" | "inner" | "outer",
  rim: number
): ShaderEffect => ({
  after: "#include <normal_fragment_begin>",
  code: `${ELEVATED_FRAME}
float graphiteFace = abs(normal.z);
float graphiteTop = smoothstep(0.08, 0.92, normal.y * 0.5 + 0.5);
float graphiteInset = smoothstep(0.12, 0.82, 1.0 - graphiteFace);
float graphiteGrain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
diffuseColor.rgb = mix(vec3(0.12), vec3(0.34), graphiteFace * 0.58 + graphiteTop * 0.28);
${profile === "inner" ? "diffuseColor.rgb += vec3(0.18) * graphiteInset;" : ""}
${profile === "outer" ? "diffuseColor.rgb += vec3(0.2) * elevatedRim + vec3(0.1) * graphiteTop;" : ""}
diffuseColor.rgb += (graphiteGrain - 0.5) * 0.035;
totalEmissiveRadiance += vec3(0.72, 0.74, 0.76) * elevatedRim * ${glsl(rim)};
totalEmissiveRadiance += vec3(0.02, 0.025, 0.035) * elevatedSide * 0.28;`,
})

/**
 * Small fragment-shader additions that give a finish its signature. Each is
 * injected after a standard three.js chunk so it composes with every model.
 */
const SHADER_EFFECTS: Record<ShaderEffectId, ShaderEffect> = {
  // Spectral reflection bands sweeping across black gloss.
  prism: {
    after: "#include <normal_fragment_begin>",
    common: SPECTRAL_BANDS,
    code: `${ELEVATED_FRAME}
vec3 elevatedColor = elevatedBandColor(elevatedBand);
totalEmissiveRadiance += elevatedColor * pow(smoothstep(0.54, 0.98, elevatedBand), 2.6) * 1.25;
totalEmissiveRadiance += elevatedColor * elevatedRim * 0.78;
totalEmissiveRadiance += vec3(0.02, 0.025, 0.035) * elevatedSide * 0.22;`,
  },
  carved: carvedEffect("center", 0.34),
  carvedInner: carvedEffect("inner", 0.2),
  carvedOuter: carvedEffect("outer", 0.48),
  // A crisp fresnel line, so cel shading reads as an outline-lit sticker.
  toon: {
    after: "#include <normal_fragment_begin>",
    code: `float toonRim = 1.0 - ${VIEW_FACING};
totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0), 0.55) * smoothstep(0.66, 0.7, toonRim) * 0.42;`,
  },
  // Thin-film hue travel that follows the viewing angle.
  holo: {
    after: "#include <normal_fragment_begin>",
    code: `float holoRim = 1.0 - ${VIEW_FACING};
float holoPhase = holoRim * 1.6 + normal.y * 0.45 + normal.x * 0.3;
vec3 holoColor = 0.55 + 0.45 * cos(6.28318 * (holoPhase + vec3(0.0, 0.33, 0.67)));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.35 + holoColor * 0.75, 0.62);
totalEmissiveRadiance += holoColor * pow(holoRim, 2.0) * 0.32;`,
  },
  // A faint pink-to-aqua shift at glancing angles, like nacre.
  pearl: {
    after: "#include <normal_fragment_begin>",
    code: `float pearlRim = pow(1.0 - ${VIEW_FACING}, 1.4);
vec3 pearlShift = mix(vec3(1.0, 0.84, 0.94), vec3(0.82, 0.96, 1.0), normal.y * 0.5 + 0.5);
diffuseColor.rgb = mix(diffuseColor.rgb, pearlShift, pearlRim * 0.6);`,
  },
  // Candy glass: color pools in the body and the rim glows saturated.
  gel: {
    after: "#include <normal_fragment_begin>",
    code: `float gelRim = 1.0 - ${VIEW_FACING};
totalEmissiveRadiance += diffuseColor.rgb * (0.18 + pow(gelRim, 1.8) * 0.95);
totalEmissiveRadiance += vec3(1.0) * pow(gelRim, 4.0) * 0.35;`,
  },
  // A bright fresnel edge keeps clear glass legible over dark backgrounds.
  glass: {
    after: "#include <normal_fragment_begin>",
    code: `float glassRim = 1.0 - ${VIEW_FACING};
totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0), 0.6) * pow(glassRim, 2.6) * 0.55;
totalEmissiveRadiance += diffuseColor.rgb * 0.06;`,
  },
  // Light scattering inside the body: the thick center glows softly.
  frost: {
    after: "#include <normal_fragment_begin>",
    code: `float frostCore = ${VIEW_FACING};
totalEmissiveRadiance += diffuseColor.rgb * (0.12 + pow(frostCore, 1.5) * 0.26);
totalEmissiveRadiance += vec3(1.0) * pow(1.0 - frostCore, 3.0) * 0.18;`,
  },
  // A white-hot core fading to saturated edges, like a lit glass tube.
  neon: {
    after: "#include <lights_fragment_begin>",
    code: `float neonCore = pow(${VIEW_FACING}, 2.4);
vec3 neonGlow = totalEmissiveRadiance + diffuseColor.rgb * 0.15;
totalEmissiveRadiance = neonGlow * (0.75 + neonCore * 0.5) + vec3(1.0) * neonCore * 0.32 * max(max(neonGlow.r, neonGlow.g), neonGlow.b);
diffuseColor.rgb *= 0.45;`,
  },
  // Additive fresnel only: edges glow, faces vanish, overlaps stack up.
  xray: {
    after: "#include <opaque_fragment>",
    code: `float xrayRim = 1.0 - ${VIEW_FACING};
gl_FragColor.rgb *= 0.06 + pow(xrayRim, 1.7) * 1.5;`,
  },
}

const addShaderEffect = <T extends THREE.Material>(
  material: T,
  id: ShaderEffectId
): T =>
  chainBeforeCompile(material, `effect-${id}`, (shader) => {
    const effect = SHADER_EFFECTS[id]
    if (effect.common) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>\n${effect.common}`
      )
    }
    shader.fragmentShader = shader.fragmentShader.replace(
      effect.after,
      `${effect.after}\n${effect.code}`
    )
  })

let toonGradientMap: THREE.DataTexture | null = null

/** Three lit bands plus a shadow band; nearest filtering keeps steps hard. */
const getToonGradientMap = () => {
  if (toonGradientMap) return toonGradientMap
  toonGradientMap = new THREE.DataTexture(
    new Uint8Array([46, 132, 255]),
    3,
    1,
    THREE.RedFormat
  )
  toonGradientMap.minFilter = THREE.NearestFilter
  toonGradientMap.magFilter = THREE.NearestFilter
  toonGradientMap.generateMipmaps = false
  toonGradientMap.needsUpdate = true
  return toonGradientMap
}

const withBaseOpacity = <T extends THREE.Material>(material: T): T => {
  material.userData.baseOpacity =
    "opacity" in material && typeof material.opacity === "number"
      ? material.opacity
      : 1
  material.userData.baseTransparent = material.transparent
  return material
}

const TRANSLUCENCY = {
  frosted: { transparent: true, depthWrite: true },
  clear: { transparent: false, opacity: 1, depthWrite: true },
  additive: {
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
} as const

export function createThreeMaterial(
  preset: MaterialPresetId,
  props: Partial<MaterialProps>
): THREE.Material {
  const spec = FINISH_SPECS[preset]
  const value = <K extends keyof FinishSettings>(key: K) =>
    props[key] ?? spec.defaults[key]

  const fill = new THREE.Color(props.color || "#a48bff")
  const opacity = props.opacity ?? 1
  const wireframe = !!props.wireframe
  const map = props.map || undefined
  const vertexColors = !!props.vertexColors
  const usesSurfaceColor = vertexColors || !!map
  const reflectance = value("reflectance")
  const emissiveIntensity = finishEmissiveIntensity(
    preset,
    value("emissiveIntensity")
  )

  // Gradients and textures are graded per pixel in the shader instead.
  const color = spec.fixedColor
    ? new THREE.Color(spec.fixedColor)
    : usesSurfaceColor
      ? new THREE.Color("#ffffff")
      : spec.grade
        ? gradeColor(fill, spec.grade)
        : fill

  const shared = {
    color,
    emissive: usesSurfaceColor ? new THREE.Color("#000000") : fill,
    // Gradients and textures glow through the shader hook instead, so the
    // glow follows each vertex color rather than one flat emissive color.
    emissiveIntensity: usesSurfaceColor ? 0 : emissiveIntensity,
    wireframe,
    transparent: opacity < 1,
    opacity,
    ...(spec.translucency ? TRANSLUCENCY[spec.translucency] : {}),
    ...(map ? { map } : {}),
    vertexColors,
  }

  let material: THREE.Material
  if (spec.model === "toon") {
    material = new THREE.MeshToonMaterial({
      ...shared,
      gradientMap: getToonGradientMap(),
    })
  } else if (spec.model === "standard") {
    material = new THREE.MeshStandardMaterial({
      ...shared,
      roughness: value("roughness"),
      metalness: finishMetalness(preset, value("metalness")),
      envMapIntensity: finishEnvMapIntensity(preset, reflectance),
    })
  } else {
    const physical = new THREE.MeshPhysicalMaterial({
      ...shared,
      roughness: value("roughness"),
      metalness: finishMetalness(preset, value("metalness")),
      clearcoat: value("clearcoat"),
      clearcoatRoughness: value("clearcoatRoughness"),
      transmission: value("transmission"),
      thickness: value("thickness"),
      ior: props.ior ?? spec.ior ?? 1.5,
      reflectivity: reflectance,
      envMapIntensity: finishEnvMapIntensity(preset, reflectance),
    })
    if (spec.attenuationDistance !== undefined && !usesSurfaceColor) {
      physical.attenuationColor = fill.clone()
      physical.attenuationDistance = spec.attenuationDistance
    }
    if (spec.sheen) {
      physical.sheen = spec.sheen.amount
      physical.sheenRoughness = spec.sheen.roughness
      physical.sheenColor =
        spec.sheen.fillMix !== undefined && !usesSurfaceColor
          ? fill
              .clone()
              .lerp(new THREE.Color(spec.sheen.color), spec.sheen.fillMix)
          : new THREE.Color(spec.sheen.color)
    }
    if (spec.iridescence) {
      physical.iridescence = spec.iridescence.amount
      physical.iridescenceIOR = spec.iridescence.ior
      physical.iridescenceThicknessRange = spec.iridescence.range
    }
    if (spec.anisotropy) {
      physical.anisotropy = spec.anisotropy.amount
      physical.anisotropyRotation = spec.anisotropy.rotation
    }
    material = physical
  }

  if (usesSurfaceColor && spec.grade) addSurfaceGrade(material, spec.grade)
  if (usesSurfaceColor) applySurfaceEmissive(material, emissiveIntensity)
  if (spec.shader) addShaderEffect(material, spec.shader)
  return spec.translucency ? withBaseOpacity(material) : material
}
