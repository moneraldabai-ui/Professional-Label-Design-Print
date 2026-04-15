import { toPng } from 'html-to-image'

/**
 * Export utilities for label PNG generation
 */

/**
 * Sanitize a string for use in filename
 */
function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'label'
}

/**
 * Generate filename based on label type and main field
 */
export function generateFilename(mainField: string, labelType: string): string {
  const sanitized = sanitizeFilename(mainField)
  const typeSanitized = sanitizeFilename(labelType)

  if (sanitized) {
    return `${sanitized}-${typeSanitized}-label.png`
  }
  return `${typeSanitized}-label-${Date.now()}.png`
}

/**
 * Export the current label preview as PNG
 */
export async function exportCurrentLabel(mainField: string, labelType: string): Promise<void> {
  const element = document.getElementById('label-preview-content')
  if (!element) {
    throw new Error('Label preview element not found')
  }

  const filename = generateFilename(mainField, labelType)
  await exportLabelAsPng(element, filename)
}

/**
 * Export a label element as PNG
 */
export async function exportLabelAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 3, // High resolution for print quality
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    document.body.appendChild(link)
    try {
      link.click()
    } finally {
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Failed to export label as PNG:', error)
    throw new Error('Failed to export label. Please try again.')
  }
}

/**
 * Export multiple labels as separate PNG files
 */
export async function exportBatchAsPng(
  elements: HTMLElement[],
  filenames: string[]
): Promise<void> {
  for (let i = 0; i < elements.length; i++) {
    await exportLabelAsPng(elements[i], filenames[i])
    // Small delay between downloads to prevent browser blocking
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}
