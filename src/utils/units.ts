/**
 * Unit conversion utilities for accurate label sizing
 *
 * Standard screen DPI is 96 pixels per inch
 * 1 inch = 25.4mm
 * Therefore: 1mm = 96 / 25.4 ≈ 3.7795 pixels
 */

const SCREEN_DPI = 96
const MM_PER_INCH = 25.4
const PX_PER_MM = SCREEN_DPI / MM_PER_INCH // ≈ 3.7795

/**
 * Convert millimeters to pixels at screen resolution (96 DPI)
 */
export function mmToPx(mm: number): number {
  return mm * PX_PER_MM
}

/**
 * Convert pixels to millimeters at screen resolution (96 DPI)
 */
export function pxToMm(px: number): number {
  return px / PX_PER_MM
}

/**
 * Get pixel dimensions for a label size in mm, with optional zoom
 */
export function getLabelPixelSize(
  widthMm: number,
  heightMm: number,
  zoomPercent: number = 100
): { width: number; height: number } {
  const scale = zoomPercent / 100
  return {
    width: Math.round(mmToPx(widthMm) * scale),
    height: Math.round(mmToPx(heightMm) * scale),
  }
}

/**
 * Format dimensions for display
 */
export function formatDimensions(widthMm: number, heightMm: number): string {
  return `${widthMm}mm × ${heightMm}mm`
}
