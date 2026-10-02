export type InspectorTab = "design" | "transform" | "lighting"

export function inspectorTabForProperty(id: string): InspectorTab {
  if (["rotation", "move", "scale"].includes(id)) return "transform"
  if (["lighting", "light-position"].includes(id)) return "lighting"
  return "design"
}
