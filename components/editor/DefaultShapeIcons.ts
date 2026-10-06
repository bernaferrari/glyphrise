import {
  appendMaterialSymbolSlash,
  PRESET_ICONS,
  type PresetIcon,
} from "./IconLibrary"

const accountCircle = PRESET_ICONS.find(
  (icon) => icon.id === "material-symbol-outlined-account_circle"
)!

export const DEFAULT_WIPE_PAIR: [PresetIcon, PresetIcon] = [
  accountCircle,
  appendMaterialSymbolSlash(accountCircle),
]
