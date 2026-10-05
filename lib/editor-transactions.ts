// Only controls that author the document emit these events. Navigation,
// selection, menus and scrolling never open an undo transaction.
export const EDITOR_EDIT_BEGIN = "glyphrise:edit-begin"
export const EDITOR_EDIT_END = "glyphrise:edit-end"
export const EDITOR_EDIT_CANCEL = "glyphrise:edit-cancel"

export const beginDocumentEdit = () =>
  window.dispatchEvent(new Event(EDITOR_EDIT_BEGIN))
export const endDocumentEdit = (canceled = false) =>
  window.dispatchEvent(
    new Event(canceled ? EDITOR_EDIT_CANCEL : EDITOR_EDIT_END)
  )
