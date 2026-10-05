const MAX_SVG_BYTES = 1_000_000
const MAX_SVG_ELEMENTS = 1_000

const ALLOWED_SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
])

const DRAWABLE_SVG_TAGS = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
])

const ALLOWED_SVG_ATTRIBUTES = new Set([
  "xmlns",
  "viewbox",
  "width",
  "height",
  "preserveaspectratio",
  "transform",
  "d",
  "fill",
  "fill-rule",
  "fill-opacity",
  "clip-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "points",
  "id",
  "data-name",
  "data-glyphrise-slash",
])

const TAG_PATTERN = /<\s*(\/?)\s*([A-Za-z][\w:-]*)([^>]*)>/g
const ATTRIBUTE_PATTERN = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/y
const ACTIVE_CONTENT_PATTERN =
  /(?:javascript\s*:|data\s*:|vbscript\s*:|url\s*\(|<\s*(?:script|style|foreignobject|iframe|object|embed|image|use|a|animate|set|audio|video)\b|\bon[a-z]+\s*=|\b(?:href|xlink:href|style)\s*=)/i

export class SvgImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SvgImportError"
  }
}

const svgByteLength = (value: string) => new TextEncoder().encode(value).length

const parseAttributes = (source: string) => {
  const attributes = new Map<string, string>()
  let cursor = 0

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1
    if (cursor >= source.length || source[cursor] === "/") break

    ATTRIBUTE_PATTERN.lastIndex = cursor
    const match = ATTRIBUTE_PATTERN.exec(source)
    if (!match) {
      throw new SvgImportError(
        "This SVG contains malformed or unsupported attributes."
      )
    }
    const name = match[1].toLowerCase()
    if (attributes.has(name)) {
      throw new SvgImportError(`This SVG repeats the “${match[1]}” attribute.`)
    }
    attributes.set(name, match[2] ?? match[3] ?? "")
    cursor = ATTRIBUTE_PATTERN.lastIndex
  }

  while (/\s/.test(source[cursor] ?? "")) cursor += 1
  if (source[cursor] === "/") cursor += 1
  while (/\s/.test(source[cursor] ?? "")) cursor += 1
  if (cursor !== source.length) {
    throw new SvgImportError(
      "This SVG contains malformed or unsupported attributes."
    )
  }

  return attributes
}

// Normalize non-rendering export markup before checking the supported drawing
// subset. References and active content remain forbidden after normalization.
const normalizeStaticSvg = (source: string) => {
  const withoutComments = source.replace(/<!--[^]*?-->/g, "")
  if (/<\s*!(?!\s*--)/.test(withoutComments)) {
    throw new SvgImportError(
      "SVG document types and entity declarations are not supported."
    )
  }
  const clean = withoutComments
    .replace(/^\s*<\?xml\s+[^?]*\?>/i, "")
    .replace(/<(metadata|title|desc)\b[^>]*>[^]*?<\/\1\s*>/gi, "")
    .replace(/<(metadata|title|desc|sodipodi:namedview)\b[^>]*\/\s*>/gi, "")
    .replace(/<defs\s*(?:\/\s*>|>\s*<\/defs\s*>)/gi, "")
  return clean
    .replace(
      /<\s*([A-Za-z][\w:-]*)([^>]*)>/g,
      (original, tag: string, attributeSource: string) => {
        const attributes = parseAttributes(attributeSource)
        let changed = false
        for (const name of attributes.keys()) {
          if (
            name.startsWith("xmlns:") ||
            name.startsWith("inkscape:") ||
            name.startsWith("sodipodi:") ||
            (name.startsWith("data-") &&
              name !== "data-glyphrise-slash" &&
              name !== "data-name") ||
            [
              "version",
              "class",
              "aria-label",
              "aria-labelledby",
              "role",
              "xml:space",
              "enable-background",
            ].includes(name)
          ) {
            attributes.delete(name)
            changed = true
          }
        }
        const style = attributes.get("style")
        if (style !== undefined) {
          changed = true
          attributes.delete("style")
          for (const declaration of style.split(";")) {
            if (!declaration.trim()) continue
            const colon = declaration.indexOf(":")
            const property = declaration.slice(0, colon).trim().toLowerCase()
            const value = declaration.slice(colon + 1).trim()
            if (
              colon < 0 ||
              !ALLOWED_SVG_ATTRIBUTES.has(property) ||
              !/^(fill|stroke|opacity)/.test(property) ||
              /[<>&"']|url\s*\(|expression|!important/i.test(value)
            ) {
              throw new SvgImportError(
                "This SVG contains an unsupported or unsafe style. Export presentation attributes or paths instead."
              )
            }
            // Inline style takes precedence over presentation attributes in SVG.
            attributes.set(property, value)
          }
        }
        if (!changed) return original
        const names: Record<string, string> = {
          viewbox: "viewBox",
          preserveaspectratio: "preserveAspectRatio",
        }
        return `<${tag}${[...attributes]
          .map(([name, value]) => {
            if (/[<>&"']/.test(value))
              throw new SvgImportError("Unsupported XML attribute value.")
            return ` ${names[name] ?? name}="${value}"`
          })
          .join("")}${/\/\s*$/.test(attributeSource) ? "/" : ""}>`
      }
    )
    .trim()
}

export const validateAndSanitizeSvg = (source: string) => {
  let svg = source.trim()
  if (!svg) throw new SvgImportError("Choose an SVG file that is not empty.")
  if (svgByteLength(svg) > MAX_SVG_BYTES) {
    throw new SvgImportError("This SVG is larger than the 1 MB import limit.")
  }
  svg = normalizeStaticSvg(svg)
  const unsupportedConstruct = svg.match(
    /<\s*(text|image|use|defs|mask|clipPath|filter|symbol)\b/i
  )
  if (unsupportedConstruct) {
    const tag = unsupportedConstruct[1].toLowerCase()
    const remediation =
      tag === "text"
        ? "Outline text to paths and export again."
        : tag === "use" || tag === "defs"
          ? "Expand <use>/<defs> instances and export again."
          : tag === "mask" || tag === "clippath"
            ? "Flatten masks/clipping paths and export again."
            : tag === "image"
              ? "Remove embedded images and export vector paths only."
              : "Export a clean SVG containing paths and basic shapes."
    throw new SvgImportError(
      `The <${unsupportedConstruct[1]}> element is not supported. ${remediation}`
    )
  }
  if (ACTIVE_CONTENT_PATTERN.test(svg) || /<\s*[!?]|&[A-Za-z#]/.test(svg)) {
    throw new SvgImportError(
      "This SVG contains scripts, links, embedded content, or XML features that are not supported."
    )
  }

  const stack: string[] = []
  let elementCount = 0
  let drawableCount = 0
  let rootCount = 0
  let consumedUntil = 0
  let match: RegExpExecArray | null

  TAG_PATTERN.lastIndex = 0
  while ((match = TAG_PATTERN.exec(svg))) {
    if (svg.slice(consumedUntil, match.index).trim()) {
      throw new SvgImportError("This SVG contains unsupported text or markup.")
    }
    consumedUntil = TAG_PATTERN.lastIndex

    const isClosing = Boolean(match[1])
    const tag = match[2].toLowerCase()
    const attributeSource = match[3]
    const isSelfClosing = /\/\s*$/.test(attributeSource)

    if (!ALLOWED_SVG_TAGS.has(tag)) {
      const remediation =
        tag === "text"
          ? " Outline text to paths and export again."
          : tag === "use" || tag === "defs"
            ? " Expand <use>/<defs> instances and export again."
            : tag === "mask" || tag === "clippath"
              ? " Flatten masks/clipping paths and export again."
              : tag === "image"
                ? " Remove embedded images and export vector paths only."
                : " Export a clean SVG containing paths and basic shapes."
      throw new SvgImportError(
        `The <${match[2]}> element is not supported.${remediation}`
      )
    }

    if (isClosing) {
      if (attributeSource.trim()) {
        throw new SvgImportError("This SVG contains a malformed closing tag.")
      }
      if (stack.pop() !== tag) {
        throw new SvgImportError("This SVG has unbalanced elements.")
      }
      continue
    }

    elementCount += 1
    if (elementCount > MAX_SVG_ELEMENTS) {
      throw new SvgImportError(
        `This SVG has more than ${MAX_SVG_ELEMENTS.toLocaleString()} elements.`
      )
    }
    if (DRAWABLE_SVG_TAGS.has(tag)) drawableCount += 1

    if (stack.length === 0) {
      rootCount += 1
      if (tag !== "svg" || rootCount > 1) {
        throw new SvgImportError("The SVG must have one <svg> root element.")
      }
    } else if (tag === "svg") {
      throw new SvgImportError("Nested <svg> elements are not supported.")
    }

    const attributes = parseAttributes(attributeSource)
    for (const [name, value] of attributes) {
      if (!ALLOWED_SVG_ATTRIBUTES.has(name) || name.startsWith("on")) {
        throw new SvgImportError(
          `The “${name}” SVG attribute is not supported.`
        )
      }
      if (name === "xmlns") {
        if (value !== "http://www.w3.org/2000/svg") {
          throw new SvgImportError(
            "This SVG uses an unsupported XML namespace."
          )
        }
        continue
      }
      if (
        /javascript\s*:|data\s*:|vbscript\s*:|url\s*\(|https?:\/\//i.test(value)
      ) {
        throw new SvgImportError(
          `The “${name}” SVG attribute contains an external or active reference.`
        )
      }
    }

    if (!isSelfClosing) stack.push(tag)
  }

  if (svg.slice(consumedUntil).trim() || stack.length > 0 || rootCount !== 1) {
    throw new SvgImportError("This SVG has malformed or unbalanced markup.")
  }
  if (drawableCount === 0) {
    throw new SvgImportError(
      "This SVG has no supported paths or basic shape elements to turn into 3D."
    )
  }

  return svg
}

export const isSvgFile = (file: File | undefined | null) =>
  Boolean(
    file &&
    file.size <= MAX_SVG_BYTES &&
    (!file.type || file.type === "image/svg+xml")
  )

export const svgImportMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Glyphrise could not read this SVG. Try exporting it as a plain SVG with paths."
