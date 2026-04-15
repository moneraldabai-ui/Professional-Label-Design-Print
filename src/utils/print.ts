/**
 * Print utilities for Zebra label printers
 * Produces exact 36mm × 86mm output with zero margins
 */

import { useLabelStore } from '../store/useLabelStore'
import { usePreviewStore } from '../store/usePreviewStore'
import { hexToRgba } from './colors'

const PRINT_STYLE_ID = 'label-print-styles'
const PRINT_CONTAINER_ID = 'print-container'

const PRINT_CSS = `
@media print {
  @page {
    size: 36mm 86mm portrait;
    margin: 0;
  }

  /* Hide everything */
  body * {
    visibility: hidden !important;
  }

  /* Show only print container */
  #${PRINT_CONTAINER_ID},
  #${PRINT_CONTAINER_ID} * {
    visibility: visible !important;
  }

  #${PRINT_CONTAINER_ID} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 36mm !important;
    height: 86mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    transform: none !important;
    zoom: 1 !important;
    -webkit-transform: none !important;
  }

  .print-label {
    width: 36mm !important;
    height: 86mm !important;
    position: relative !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    transform: none !important;
    zoom: 1 !important;
    /* background is set inline from template settings */
  }

  .print-label:last-child {
    page-break-after: auto !important;
  }

  /* Strip selection outlines from label elements, but preserve content backgrounds */
  #${PRINT_CONTAINER_ID} [data-element-id] {
    outline: none !important;
  }

  /* Preserve colors and backgrounds */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
`

function injectPrintStyles(): void {
  const existing = document.getElementById(PRINT_STYLE_ID)
  if (existing) existing.remove()

  const style = document.createElement('style')
  style.id = PRINT_STYLE_ID
  style.textContent = PRINT_CSS
  document.head.appendChild(style)
}

function removePrintStyles(): void {
  const existing = document.getElementById(PRINT_STYLE_ID)
  if (existing) existing.remove()
}

function cleanupPrintContainer(): void {
  const container = document.getElementById(PRINT_CONTAINER_ID)
  if (container) container.remove()
  removePrintStyles()
}

/**
 * Execute print with guaranteed cleanup using afterprint event
 */
function executePrintWithCleanup(): void {
  // Fallback timeout in case afterprint never fires (e.g., popup blocked)
  const timeout = setTimeout(() => {
    cleanupPrintContainer()
    window.removeEventListener('afterprint', handleAfterPrint)
  }, 5000)

  const handleAfterPrint = () => {
    clearTimeout(timeout)
    cleanupPrintContainer()
    window.removeEventListener('afterprint', handleAfterPrint)
  }
  window.addEventListener('afterprint', handleAfterPrint)

  setTimeout(() => {
    window.print()
  }, 100)
}

/**
 * Prepare a label clone for printing.
 *
 * The preview renders at the user's zoom level — font sizes, barcode dimensions,
 * and other content are scaled by zoom/100. Positions use percentages so they
 * adapt to any container size. To produce a correct 36mm × 86mm print:
 *
 *  1. Set the outer label to exactly 36mm × 86mm in mm units.
 *  2. Wrap the inner content in a scaling div that undoes the zoom
 *     (transform: scale(100/zoom)), so content renders at 1:1 physical size.
 *  3. Force transform: none and zoom: 1 on the label itself so browser zoom
 *     cannot affect the output.
 */
function preparePrintClone(labelElement: HTMLElement): HTMLElement {
  const zoom = useLabelStore.getState().zoom
  const previewProps = usePreviewStore.getState().previewProps
  const scale = zoom / 100

  // Get background settings from preview store
  const backgroundColor = previewProps?.backgroundColor ?? '#ffffff'
  const backgroundOpacity = (previewProps?.backgroundOpacity ?? 100) / 100

  const labelClone = labelElement.cloneNode(true) as HTMLElement
  labelClone.removeAttribute('id')

  // Outer label: pure mm dimensions, no classes, no pixel values
  // Apply background color with opacity using rgba
  const bgColor = hexToRgba(backgroundColor, backgroundOpacity)

  labelClone.className = 'print-label'
  labelClone.style.cssText = [
    'width: 36mm',
    'height: 86mm',
    'position: relative',
    'overflow: hidden',
    `background: ${bgColor}`,
    'border: none',
    'box-shadow: none',
    'border-radius: 0',
    'transform: none',
    'zoom: 1',
    'margin: 0',
    'padding: 0',
    'box-sizing: border-box',
  ].join('; ')

  // The inner content div (CustomLabelPreview's root) has zoom-scaled content.
  // Apply a counter-scale transform so it renders at 1:1 physical size.
  const innerContent = labelClone.firstElementChild as HTMLElement
  if (innerContent && scale !== 1) {
    const origW = labelElement.offsetWidth
    const origH = labelElement.offsetHeight

    innerContent.style.cssText = [
      'position: absolute',
      'top: 0',
      'left: 0',
      `width: ${origW}px`,
      `height: ${origH}px`,
      `transform: scale(${1 / scale})`,
      'transform-origin: top left',
      'overflow: visible',
    ].join('; ')

    // Remove Tailwind classes that could interfere
    innerContent.className = ''
  }

  return labelClone
}

/**
 * Print the current label from preview
 */
export function printCurrentLabel(): void {
  const labelElement = document.getElementById('label-preview-content')
  if (!labelElement) {
    console.error('Label preview element not found')
    return
  }

  cleanupPrintContainer()

  const printContainer = document.createElement('div')
  printContainer.id = PRINT_CONTAINER_ID

  const labelClone = preparePrintClone(labelElement)
  printContainer.appendChild(labelClone)
  document.body.appendChild(printContainer)

  injectPrintStyles()
  executePrintWithCleanup()
}

/**
 * Print a single label element
 */
export function printLabel(labelElement: HTMLElement): void {
  cleanupPrintContainer()

  const printContainer = document.createElement('div')
  printContainer.id = PRINT_CONTAINER_ID

  const labelClone = preparePrintClone(labelElement)
  printContainer.appendChild(labelClone)
  document.body.appendChild(printContainer)

  injectPrintStyles()
  executePrintWithCleanup()
}

/**
 * Print multiple labels in batch
 */
export function printBatch(labelElements: HTMLElement[]): void {
  if (labelElements.length === 0) return

  cleanupPrintContainer()

  const printContainer = document.createElement('div')
  printContainer.id = PRINT_CONTAINER_ID

  labelElements.forEach((label) => {
    const labelClone = preparePrintClone(label)
    printContainer.appendChild(labelClone)
  })

  document.body.appendChild(printContainer)

  injectPrintStyles()
  executePrintWithCleanup()
}
