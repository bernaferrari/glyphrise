export const extractSvgInner = (svgContent: string) =>
  svgContent
    .replace(/^<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim()

export const normalizeSvgToIconViewBox = (svgContent: string): string => {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
  if (!viewBoxMatch) {
    // Some official symbols declare dimensions without a viewBox.
    const root = svgContent.match(/^<svg\b[^>]*>/i)?.[0] ?? ""
    const width = root.match(/\bwidth=["'](\d+(?:\.\d+)?)(?:px)?["']/i)?.[1]
    const height = root.match(/\bheight=["'](\d+(?:\.\d+)?)(?:px)?["']/i)?.[1]
    if (!width || !height || Number(width) <= 0 || Number(height) <= 0)
      return svgContent
    return normalizeSvgToIconViewBox(
      svgContent.replace(/^<svg\b/i, `<svg viewBox="0 0 ${width} ${height}"`)
    )
  }

  const [minX, minY, width, height] = viewBoxMatch[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  if (
    ![minX, minY, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  ) {
    return svgContent
  }

  if (minX === 0 && minY === 0 && width === 24 && height === 24) {
    return svgContent
  }

  const scaleX = 24 / width
  const scaleY = 24 / height
  const translateX = -minX * scaleX
  const translateY = -minY * scaleY

  return `<svg viewBox="0 0 24 24"><g transform="matrix(${scaleX} 0 0 ${scaleY} ${translateX} ${translateY})">${extractSvgInner(svgContent)}</g></svg>`
}

export const appendGlyphriseSlash = (svgContent: string) => {
  const normalized = normalizeSvgToIconViewBox(svgContent)
  // Parallelogram on the 24×24 grid with square ends (perpendicular to the
  // diagonal, length ≈ 2). Keeps both the top and bottom of the bar closed;
  // a skewed trapezoid made one end look open.
  return `<svg viewBox="0 0 24 24">${extractSvgInner(normalized)}<path data-glyphrise-slash="true" d="M1.29 2.71 2.71 1.29 22.71 21.29 21.29 22.71z"/></svg>`
}
