import { createEditorId } from "./EditorModel"

export const createAddIconPickerTarget = () => createEditorId("add-icon")
export const isAddIconPickerTarget = (id: string | null) =>
  Boolean(id?.startsWith("add-icon-"))
