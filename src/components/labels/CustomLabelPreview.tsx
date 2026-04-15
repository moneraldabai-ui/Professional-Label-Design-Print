import { useCallback, useEffect, useRef, useState } from 'react'
import BarcodeRenderer from '../barcode/BarcodeRenderer'
import {
  TemplateElement,
  TextBlockElement,
  BarcodeTemplateElement,
  StaticTextElement,
  DividerElement,
  HeaderElement,
  FooterElement,
  ShapeElement,
  TableElement,
  TableCell,
} from '../../store/useCustomTemplateStore'
import { useToolbarStore } from '../../store/useToolbarStore'
import { useLabelStore } from '../../store/useLabelStore'
import { pxToMm, mmToPx } from '../../utils/units'
import { hexToRgba } from '../../utils/colors'

interface CustomLabelPreviewProps {
  elements: TemplateElement[]
  fieldValues: Record<string, string>
  zoom: number
  onElementUpdate?: (id: string, updates: Partial<TemplateElement>) => void
  onElementDoubleClick?: (elementId: string) => void
}

// Minimum element size in mm
const MIN_SIZE_MM = 5

// Resize handle types
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'

// Estimate element height in mm for auto-layout
function estimateElementHeight(element: TemplateElement): number {
  // If element has explicit height, use it
  if (element.height !== undefined) return element.height

  switch (element.type) {
    case 'text-block': {
      const el = element as TextBlockElement
      return Math.max(MIN_SIZE_MM, el.fontSize * 0.4 + 1)
    }
    case 'barcode':
      return 12
    case 'static-text': {
      const el = element as StaticTextElement
      return Math.max(MIN_SIZE_MM, el.fontSize * 0.4 + 1)
    }
    case 'divider':
      return MIN_SIZE_MM
    case 'header':
    case 'footer':
      return (element as HeaderElement | FooterElement).barHeight
    case 'shape':
      return 10 // Default shape size
    case 'table':
      const tbl = element as TableElement
      return tbl.rows * tbl.rowHeight
    default:
      return MIN_SIZE_MM
  }
}

// Estimate element width in mm for auto-layout
function estimateElementWidth(element: TemplateElement, labelWidth: number): number {
  // Header and footer are always full width
  if (element.type === 'header' || element.type === 'footer') {
    return labelWidth
  }

  // If element has explicit width, use it
  if (element.width !== undefined) return element.width

  switch (element.type) {
    case 'divider':
      return labelWidth - 2
    case 'barcode':
      return 25
    default:
      return Math.max(MIN_SIZE_MM, labelWidth - 4)
  }
}

// Compute auto-layout positions for elements that don't have explicit positions
function computeAutoPositions(
  elements: TemplateElement[],
  labelWidthMm: number
): Map<string, { x: number; y: number; w: number; h: number }> {
  const positions = new Map<string, { x: number; y: number; w: number; h: number }>()
  let currentY = 2

  for (const el of elements) {
    const h = estimateElementHeight(el)
    const w = estimateElementWidth(el, labelWidthMm)
    const x = el.posX ?? 1
    const y = el.posY ?? currentY

    positions.set(el.id, { x, y, w, h })
    if (el.posY === undefined) {
      currentY = y + h + 1
    }
  }

  return positions
}

function CustomLabelPreview({
  elements,
  fieldValues,
  zoom,
  onElementUpdate,
  onElementDoubleClick,
}: CustomLabelPreviewProps) {
  const scale = zoom / 100
  const dimensions = useLabelStore((s) => s.dimensions)

  // Use individual selectors to avoid subscribing to entire store
  const activeTool = useToolbarStore((s) => s.activeTool)
  const selectedElement = useToolbarStore((s) => s.selectedElement)
  const setSelectedElement = useToolbarStore((s) => s.setSelectedElement)
  const setLabelDimensions = useToolbarStore((s) => s.setLabelDimensions)

  const containerRef = useRef<HTMLDivElement>(null)

  // Drag state for moving elements
  const dragRef = useRef<{
    elementId: string
    startMouseX: number
    startMouseY: number
    startElX: number
    startElY: number
    finalX?: number
    finalY?: number
  } | null>(null)

  // Resize state
  const resizeRef = useRef<{
    elementId: string
    handle: ResizeHandle
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
    startW: number
    startH: number
    finalX?: number
    finalY?: number
    finalW?: number
    finalH?: number
  } | null>(null)

  // Local drag position — only used during active drag to avoid cascading store updates
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)

  // Local resize state — only used during active resize
  const [resizeState, setResizeState] = useState<{
    id: string
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  // Derived booleans for stable useEffect dependencies
  const isDraggingActive = dragPos !== null
  const isResizingActive = resizeState !== null

  // Keep label dimensions in sync for alignment tools
  // Use useEffect to safely update after render is complete
  useEffect(() => {
    setLabelDimensions({ width: dimensions.width, height: dimensions.height })
  }, [dimensions.width, dimensions.height, setLabelDimensions])

  // Use a pre-filtered list for auto-position calculation too
  const safeElements = elements.filter(
    (el) => el && typeof el === 'object' && el.id && el.type
  )
  const autoPositions = computeAutoPositions(safeElements, dimensions.width)

  const getElementPosition = useCallback(
    (el: TemplateElement) => {
      const auto = autoPositions.get(el.id) || { x: 0, y: 0, w: MIN_SIZE_MM, h: MIN_SIZE_MM }
      return {
        x: el.posX ?? auto.x,
        y: el.posY ?? auto.y,
        w: el.width ?? auto.w,
        h: el.height ?? auto.h,
      }
    },
    [autoPositions]
  )

  // Handle element click for selection
  const handleElementClick = useCallback(
    (e: React.MouseEvent, el: TemplateElement) => {
      e.stopPropagation()
      if (activeTool === 'none') return

      const pos = getElementPosition(el)
      const rotation = el.freeRotation ?? el.rotation ?? 0

      setSelectedElement({
        id: el.id,
        rotation,
        scale: el.absScale ?? 1,
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        flipH: el.flipH ?? false,
        flipV: el.flipV ?? false,
        zIndex: el.zIndex ?? 0,
        locked: el.locked ?? false,
      })
    },
    [activeTool, getElementPosition, setSelectedElement]
  )

  // Handle drag start (Move tool only)
  const handleDragStart = useCallback(
    (e: React.MouseEvent, el: TemplateElement) => {
      if (activeTool !== 'move') return
      if (el.locked) return // Locked elements cannot be dragged
      e.preventDefault()
      e.stopPropagation()

      const pos = getElementPosition(el)
      const rotation = el.freeRotation ?? el.rotation ?? 0

      // Select the element in toolbar store (one-time, for selection visual + properties)
      setSelectedElement({
        id: el.id,
        rotation,
        scale: el.absScale ?? 1,
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        flipH: el.flipH ?? false,
        flipV: el.flipV ?? false,
        zIndex: el.zIndex ?? 0,
        locked: el.locked ?? false,
      })

      dragRef.current = {
        elementId: el.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startElX: pos.x,
        startElY: pos.y,
      }
      // Initialize local drag position
      setDragPos({ id: el.id, x: pos.x, y: pos.y })
    },
    [activeTool, getElementPosition, setSelectedElement]
  )

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, el: TemplateElement, handle: ResizeHandle) => {
      if (el.locked) return // Locked elements cannot be resized
      e.preventDefault()
      e.stopPropagation()

      const pos = getElementPosition(el)

      resizeRef.current = {
        elementId: el.id,
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: pos.x,
        startY: pos.y,
        startW: pos.w,
        startH: pos.h,
      }

      setResizeState({
        id: el.id,
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
      })
    },
    [getElementPosition]
  )

  // Handle mouse move/up for dragging — uses local state only, no store updates during drag
  useEffect(() => {
    if (!dragRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return

      const deltaXPx = e.clientX - dragRef.current.startMouseX
      const deltaYPx = e.clientY - dragRef.current.startMouseY

      // Convert pixel delta to mm delta (accounting for zoom)
      const deltaXMm = pxToMm(deltaXPx / scale)
      const deltaYMm = pxToMm(deltaYPx / scale)

      let newX = dragRef.current.startElX + deltaXMm
      let newY = dragRef.current.startElY + deltaYMm

      // Clamp to label boundaries
      newX = Math.max(0, Math.min(dimensions.width - 2, newX))
      newY = Math.max(0, Math.min(dimensions.height - 2, newY))

      // Update local drag position only — no store updates during drag
      setDragPos({ id: dragRef.current.elementId, x: newX, y: newY })
      // Also store in ref so mouseUp can read final position
      dragRef.current.finalX = newX
      dragRef.current.finalY = newY
    }

    const handleMouseUp = () => {
      const ref = dragRef.current
      if (!ref) return

      const elementId = ref.elementId
      const finalX = ref.finalX ?? ref.startElX
      const finalY = ref.finalY ?? ref.startElY

      // Clear state FIRST
      setDragPos(null)
      dragRef.current = null

      // THEN commit to store (outside state setter)
      if (onElementUpdate) {
        onElementUpdate(elementId, {
          posX: Math.round(finalX * 100) / 100,
          posY: Math.round(finalY * 100) / 100,
        })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingActive, scale, dimensions.width, dimensions.height, onElementUpdate])

  // Handle mouse move/up for resizing
  useEffect(() => {
    if (!resizeRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return

      const { handle, startMouseX, startMouseY, startX, startY, startW, startH } = resizeRef.current

      const deltaXPx = e.clientX - startMouseX
      const deltaYPx = e.clientY - startMouseY

      // Convert pixel delta to mm delta (accounting for zoom)
      const deltaXMm = pxToMm(deltaXPx / scale)
      const deltaYMm = pxToMm(deltaYPx / scale)

      let newX = startX
      let newY = startY
      let newW = startW
      let newH = startH

      // Apply resize based on handle
      switch (handle) {
        case 'nw':
          newX = startX + deltaXMm
          newY = startY + deltaYMm
          newW = startW - deltaXMm
          newH = startH - deltaYMm
          break
        case 'n':
          newY = startY + deltaYMm
          newH = startH - deltaYMm
          break
        case 'ne':
          newY = startY + deltaYMm
          newW = startW + deltaXMm
          newH = startH - deltaYMm
          break
        case 'w':
          newX = startX + deltaXMm
          newW = startW - deltaXMm
          break
        case 'e':
          newW = startW + deltaXMm
          break
        case 'sw':
          newX = startX + deltaXMm
          newW = startW - deltaXMm
          newH = startH + deltaYMm
          break
        case 's':
          newH = startH + deltaYMm
          break
        case 'se':
          newW = startW + deltaXMm
          newH = startH + deltaYMm
          break
      }

      // Enforce minimum size
      if (newW < MIN_SIZE_MM) {
        if (handle === 'nw' || handle === 'w' || handle === 'sw') {
          newX = startX + startW - MIN_SIZE_MM
        }
        newW = MIN_SIZE_MM
      }
      if (newH < MIN_SIZE_MM) {
        if (handle === 'nw' || handle === 'n' || handle === 'ne') {
          newY = startY + startH - MIN_SIZE_MM
        }
        newH = MIN_SIZE_MM
      }

      // Clamp position to label boundaries
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)

      // Clamp size to not exceed label boundaries
      if (newX + newW > dimensions.width) {
        newW = dimensions.width - newX
      }
      if (newY + newH > dimensions.height) {
        newH = dimensions.height - newY
      }

      setResizeState({
        id: resizeRef.current.elementId,
        x: newX,
        y: newY,
        w: newW,
        h: newH,
      })
      // Also store in ref so mouseUp can read final values
      resizeRef.current.finalX = newX
      resizeRef.current.finalY = newY
      resizeRef.current.finalW = newW
      resizeRef.current.finalH = newH
    }

    const handleMouseUp = () => {
      const ref = resizeRef.current
      if (!ref) return

      const elementId = ref.elementId
      const finalX = ref.finalX ?? ref.startX
      const finalY = ref.finalY ?? ref.startY
      const finalW = ref.finalW ?? ref.startW
      const finalH = ref.finalH ?? ref.startH

      // Clear state FIRST
      setResizeState(null)
      resizeRef.current = null

      // THEN commit to store (outside state setter)
      if (onElementUpdate) {
        onElementUpdate(elementId, {
          posX: Math.round(finalX * 100) / 100,
          posY: Math.round(finalY * 100) / 100,
          width: Math.round(finalW * 100) / 100,
          height: Math.round(finalH * 100) / 100,
        })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingActive, scale, dimensions.width, dimensions.height, onElementUpdate])

  // Handle double-click on text elements for inline editing
  const handleElementDoubleClick = useCallback(
    (e: React.MouseEvent, el: TemplateElement) => {
      // Only handle text-block and static-text elements
      if (el.type !== 'text-block' && el.type !== 'static-text') return

      e.preventDefault()
      e.stopPropagation()

      if (onElementDoubleClick) {
        onElementDoubleClick(el.id)
      }
    },
    [onElementDoubleClick]
  )

  // Click on empty area to deselect
  const handleCanvasClick = useCallback(() => {
    setSelectedElement(null)
  }, [setSelectedElement])

  // Get the rendered position and size for an element
  const getRenderedBounds = (el: TemplateElement) => {
    // During resize, use local resize state for the resized element
    if (resizeState && resizeState.id === el.id) {
      return { x: resizeState.x, y: resizeState.y, w: resizeState.w, h: resizeState.h }
    }
    // During drag, use local drag position for the dragged element
    if (dragPos && dragPos.id === el.id) {
      const pos = getElementPosition(el)
      return { x: dragPos.x, y: dragPos.y, w: pos.w, h: pos.h }
    }
    return getElementPosition(el)
  }

  // Build CSS transform string — only rotation, scale, flip (never position)
  const buildTransform = (el: TemplateElement): string => {
    const rotation = el.freeRotation ?? el.rotation ?? 0
    const elScale = el.absScale ?? 1
    const flipH = el.flipH ?? false
    const flipV = el.flipV ?? false

    const parts: string[] = []
    if (rotation !== 0) parts.push(`rotate(${rotation}deg)`)
    if (elScale !== 1) parts.push(`scale(${elScale})`)
    if (flipH) parts.push('scaleX(-1)')
    if (flipV) parts.push('scaleY(-1)')

    return parts.join(' ')
  }

  const isSelected = (id: string) => selectedElement?.id === id
  const isDragging = (id: string) => dragPos?.id === id
  const isResizing = (id: string) => resizeState?.id === id
  const cursorStyle = activeTool === 'move' ? 'cursor-move' : activeTool === 'select' ? 'cursor-pointer' : 'cursor-default'

  // Render resize handles for selected element
  const renderResizeHandles = (element: TemplateElement, bounds: { x: number; y: number; w: number; h: number }) => {
    if (!isSelected(element.id) || activeTool === 'none') return null
    if (element.locked) return null // Locked elements don't show resize handles

    const handleSize = 6
    const halfHandle = handleSize / 2

    // Convert bounds to pixels for handle positioning
    const widthPx = mmToPx(bounds.w) * scale
    const heightPx = mmToPx(bounds.h) * scale

    const handles: { handle: ResizeHandle; cursor: string; left: number; top: number }[] = [
      { handle: 'nw', cursor: 'nw-resize', left: -halfHandle, top: -halfHandle },
      { handle: 'n', cursor: 'n-resize', left: widthPx / 2 - halfHandle, top: -halfHandle },
      { handle: 'ne', cursor: 'ne-resize', left: widthPx - halfHandle, top: -halfHandle },
      { handle: 'w', cursor: 'w-resize', left: -halfHandle, top: heightPx / 2 - halfHandle },
      { handle: 'e', cursor: 'e-resize', left: widthPx - halfHandle, top: heightPx / 2 - halfHandle },
      { handle: 'sw', cursor: 'sw-resize', left: -halfHandle, top: heightPx - halfHandle },
      { handle: 's', cursor: 's-resize', left: widthPx / 2 - halfHandle, top: heightPx - halfHandle },
      { handle: 'se', cursor: 'se-resize', left: widthPx - halfHandle, top: heightPx - halfHandle },
    ]

    return (
      <>
        {handles.map(({ handle, cursor, left, top }) => (
          <div
            key={handle}
            className="absolute"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              cursor,
              zIndex: 1000,
            }}
            onMouseDown={(e) => handleResizeStart(e, element, handle)}
          />
        ))}
      </>
    )
  }

  // Render individual elements
  const renderTextBlock = (element: TextBlockElement, widthPx: number) => {
    const value = fieldValues[element.id] || ''
    const fontSize = Math.max(6, element.fontSize * scale)

    return (
      <div
        style={{
          textAlign: element.textAlign,
          fontSize: `${fontSize}px`,
          fontWeight: element.fontWeight,
          lineHeight: 1.3,
          width: `${widthPx}px`,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          overflow: 'hidden',
        }}
      >
        {value || (
          <span className="text-muted opacity-50">{element.placeholder}</span>
        )}
      </div>
    )
  }

  const renderBarcode = (element: BarcodeTemplateElement, widthPx: number) => {
    const value = fieldValues[element.id] || ''
    const barcodeScale = Math.max(1, Math.round(scale * 1.5))

    return (
      <div style={{ width: `${widthPx}px`, overflow: 'hidden' }}>
        {value ? (
          <div className="flex flex-col items-center">
            <BarcodeRenderer
              data={value}
              type={element.barcodeType}
              scale={barcodeScale}
              height={Math.max(8, Math.round(12 * scale))}
              qrDotsStyle={element.qrDotsStyle}
              qrCornersStyle={element.qrCornersStyle}
              qrCornersShape={element.qrCornersShape}
            />
            {element.showText && (
              <div
                className="font-mono text-dark mt-0.5 truncate max-w-full"
                style={{ fontSize: `${Math.max(6, 8 * scale)}px` }}
              >
                {value}
              </div>
            )}
          </div>
        ) : (
          <div
            className="text-muted opacity-40 font-mono border-2 border-dashed border-gray-200 px-3 py-2 rounded text-center"
            style={{ fontSize: `${Math.max(6, 8 * scale)}px` }}
          >
            [{element.label || 'barcode'}]
          </div>
        )}
      </div>
    )
  }

  const renderStaticText = (element: StaticTextElement, widthPx: number) => {
    const fontSize = Math.max(6, element.fontSize * scale)

    return (
      <div
        className="text-dark"
        style={{
          textAlign: element.textAlign,
          fontSize: `${fontSize}px`,
          fontWeight: element.fontWeight,
          lineHeight: 1.3,
          width: `${widthPx}px`,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          overflow: 'hidden',
        }}
      >
        {element.content}
      </div>
    )
  }

  const renderDivider = (element: DividerElement, widthPx: number) => {
    const borderStyle =
      element.style === 'dashed' ? 'dashed' : element.style === 'dotted' ? 'dotted' : 'solid'

    return (
      <div style={{ width: `${widthPx}px` }}>
        <hr
          style={{
            borderTopWidth: `${element.thickness}px`,
            borderTopStyle: borderStyle,
            borderTopColor: '#e5e7eb',
            margin: 0,
          }}
        />
      </div>
    )
  }

  const renderHeaderFooter = (element: HeaderElement | FooterElement) => {
    const bgOpacity = element.backgroundOpacity / 100

    const paddingH = Math.max(4, 8 * scale)
    const textAlign = element.textAlign

    return (
      <div
        className="w-full h-full flex items-center"
        style={{
          backgroundColor: hexToRgba(element.backgroundColor, bgOpacity),
          color: element.textColor,
          fontSize: `${element.fontSize * scale}px`,
          fontWeight: element.fontWeight,
          justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
          paddingLeft: `${paddingH}px`,
          paddingRight: `${paddingH}px`,
        }}
      >
        <span className="truncate">{element.content}</span>
      </div>
    )
  }

  const renderShape = (element: ShapeElement) => {
    const fillColor = element.fillStyle === 'none' ? 'none' : hexToRgba(element.fillColor, element.fillOpacity / 100)
    const strokeColor = element.strokeColor
    const strokeWidth = element.strokeWidth
    const strokeDasharray = element.strokeStyle === 'dashed' ? '8,4' : element.strokeStyle === 'dotted' ? '2,2' : undefined

    // Common SVG props
    const svgProps = {
      className: 'w-full h-full',
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
    }

    const shapeProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth * 2, // Scale for viewBox
      strokeDasharray,
    }

    switch (element.shapeType) {
      case 'rectangle':
        return (
          <svg {...svgProps}>
            <rect x={strokeWidth} y={strokeWidth} width={100 - strokeWidth * 2} height={100 - strokeWidth * 2} {...shapeProps} />
          </svg>
        )
      case 'oval':
        return (
          <svg {...svgProps}>
            <ellipse cx="50" cy="50" rx={50 - strokeWidth} ry={50 - strokeWidth} {...shapeProps} />
          </svg>
        )
      case 'triangle':
        return (
          <svg {...svgProps}>
            <polygon points="50,5 95,95 5,95" {...shapeProps} />
          </svg>
        )
      case 'star':
        // 5-point star
        return (
          <svg {...svgProps}>
            <polygon
              points="50,5 61,39 97,39 68,61 79,95 50,75 21,95 32,61 3,39 39,39"
              {...shapeProps}
            />
          </svg>
        )
      case 'line-horizontal':
        return (
          <svg {...svgProps} viewBox="0 0 100 10">
            <line x1="0" y1="5" x2="100" y2="5" stroke={strokeColor} strokeWidth={strokeWidth * 2} strokeDasharray={strokeDasharray} />
          </svg>
        )
      case 'line-vertical':
        return (
          <svg {...svgProps} viewBox="0 0 10 100">
            <line x1="5" y1="0" x2="5" y2="100" stroke={strokeColor} strokeWidth={strokeWidth * 2} strokeDasharray={strokeDasharray} />
          </svg>
        )
      case 'line-diagonal':
        return (
          <svg {...svgProps}>
            <line x1="0" y1="100" x2="100" y2="0" stroke={strokeColor} strokeWidth={strokeWidth * 2} strokeDasharray={strokeDasharray} />
          </svg>
        )
      case 'arrow-right':
        return (
          <svg {...svgProps}>
            <polygon points="0,25 70,25 70,10 100,50 70,90 70,75 0,75" {...shapeProps} />
          </svg>
        )
      case 'arrow-up':
        return (
          <svg {...svgProps}>
            <polygon points="50,0 90,30 75,30 75,100 25,100 25,30 10,30" {...shapeProps} />
          </svg>
        )
      case 'heart':
        return (
          <svg {...svgProps}>
            <path
              d="M50,90 C20,60 0,40 10,25 C20,10 35,10 50,25 C65,10 80,10 90,25 C100,40 80,60 50,90 Z"
              {...shapeProps}
            />
          </svg>
        )
      case 'diamond':
        return (
          <svg {...svgProps}>
            <polygon points="50,5 95,50 50,95 5,50" {...shapeProps} />
          </svg>
        )
      case 'speech-bubble':
        return (
          <svg {...svgProps}>
            {/* Rounded rectangle body + triangle pointer at bottom center */}
            <path
              d="M12,5 H88 Q95,5 95,12 V60 Q95,67 88,67 H58 L50,80 L42,67 H12 Q5,67 5,60 V12 Q5,5 12,5 Z"
              {...shapeProps}
            />
          </svg>
        )
      case 'hexagon':
        return (
          <svg {...svgProps}>
            <polygon points="50,5 93,25 93,75 50,95 7,75 7,25" {...shapeProps} />
          </svg>
        )
      case 'pentagon':
        return (
          <svg {...svgProps}>
            <polygon points="50,5 95,38 80,95 20,95 5,38" {...shapeProps} />
          </svg>
        )
      case 'bookmark':
        return (
          <svg {...svgProps}>
            <polygon points="15,5 85,5 85,95 50,75 15,95" {...shapeProps} />
          </svg>
        )
      case 'price-tag':
        return (
          <svg {...svgProps}>
            <path
              d="M5,25 Q5,5 25,5 H95 V95 H25 Q5,95 5,75 Z M20,50 a6,6 0 1,0 0.01,0"
              {...shapeProps}
              fillRule="evenodd"
            />
          </svg>
        )
      case 'shield':
        return (
          <svg {...svgProps}>
            <path
              d="M50,5 L95,20 Q95,25 95,35 Q92,75 50,95 Q8,75 5,35 Q5,25 5,20 Z"
              {...shapeProps}
            />
          </svg>
        )
      case 'chevron-arrow':
        return (
          <svg {...svgProps}>
            <polygon points="5,15 30,15 70,50 30,85 5,85 45,50" {...shapeProps} />
          </svg>
        )
      case 'rounded-rectangle':
        return (
          <svg {...svgProps}>
            <rect x="5" y="5" width="90" height="90" rx="25" ry="25" {...shapeProps} />
          </svg>
        )
      case 'starburst':
        return (
          <svg {...svgProps}>
            <polygon
              points="50,5 56,35 85,20 65,45 95,50 65,55 85,80 56,65 50,95 44,65 15,80 35,55 5,50 35,45 15,20 44,35"
              {...shapeProps}
            />
          </svg>
        )
      case 'cross':
        return (
          <svg {...svgProps}>
            <path
              d="M35,5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z"
              {...shapeProps}
            />
          </svg>
        )
      default:
        return null
    }
  }

  const renderTable = (element: TableElement) => {
    const getCell = (row: number, col: number): TableCell | undefined => {
      return element.cells.find((c) => c.row === row && c.col === col)
    }

    const borderStyle = element.borderStyle === 'none'
      ? 'none'
      : `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`

    const cellPaddingPx = element.cellPadding * scale * 3.78 // mm to px approximation

    return (
      <table
        className="w-full h-full"
        style={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          {Array.from({ length: element.rows }).map((_, rowIdx) => {
            const isHeaderRow = element.hasHeaderRow && rowIdx === 0
            const isAlternate = element.alternatingRows && rowIdx % 2 === 1

            return (
              <tr key={rowIdx}>
                {Array.from({ length: element.columns }).map((_, colIdx) => {
                  const cell = getCell(rowIdx, colIdx)
                  let bgColor = 'transparent'
                  if (isHeaderRow) {
                    bgColor = element.headerBgColor
                  } else if (isAlternate) {
                    bgColor = element.alternatingColor
                  }

                  return (
                    <td
                      key={colIdx}
                      style={{
                        border: borderStyle,
                        padding: `${cellPaddingPx}px`,
                        fontSize: `${(cell?.fontSize || 8) * scale}px`,
                        fontWeight: cell?.fontWeight || 'normal',
                        textAlign: cell?.textAlign || 'center',
                        backgroundColor: bgColor,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        height: `${element.rowHeight * scale * 3.78}px`,
                        verticalAlign: 'middle',
                      }}
                    >
                      {cell?.content || ''}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const renderElementContent = (element: TemplateElement, widthPx: number) => {
    switch (element.type) {
      case 'text-block':
        return renderTextBlock(element as TextBlockElement, widthPx)
      case 'barcode':
        return renderBarcode(element as BarcodeTemplateElement, widthPx)
      case 'static-text':
        return renderStaticText(element as StaticTextElement, widthPx)
      case 'divider':
        return renderDivider(element as DividerElement, widthPx)
      case 'header':
      case 'footer':
        return renderHeaderFooter(element as HeaderElement | FooterElement)
      case 'shape':
        return renderShape(element as ShapeElement)
      case 'table':
        return renderTable(element as TableElement)
      default:
        return null
    }
  }

  // Filter out any malformed elements (corrupted localStorage data)
  const validElements = elements.filter(
    (el) => el && typeof el === 'object' && el.id && el.type
  )

  if (validElements.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        <span style={{ fontSize: `${Math.max(8, 10 * scale)}px` }}>
          No elements added
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onClick={handleCanvasClick}
      style={{ cursor: activeTool === 'none' ? 'default' : undefined }}
    >
      {validElements.map((element) => {
        const bounds = getRenderedBounds(element)
        const selected = isSelected(element.id)
        const dragging = isDragging(element.id)
        const resizing = isResizing(element.id)
        const transform = buildTransform(element)
        const zIndex = element.zIndex ?? 0

        // Header and footer have special positioning
        const isHeader = element.type === 'header'
        const isFooter = element.type === 'footer'
        const isHeaderOrFooter = isHeader || isFooter

        // Convert bounds to pixels
        const widthPx = mmToPx(bounds.w) * scale
        const heightPx = mmToPx(bounds.h) * scale
        // For CSS: header/footer are 100% width, others use pixel value
        const widthStyle = isHeaderOrFooter ? '100%' : `${widthPx}px`

        // Header/footer: fixed position (top=0 for header, bottom=0 for footer)
        // Other elements: percentage-based positioning
        let leftPercent: number | undefined
        let topPercent: number | undefined
        let bottomPos: string | undefined

        if (isHeader) {
          leftPercent = 0
          topPercent = 0
        } else if (isFooter) {
          leftPercent = 0
          bottomPos = '0'
        } else {
          leftPercent = (bounds.x / dimensions.width) * 100
          topPercent = (bounds.y / dimensions.height) * 100
        }

        // Header/footer always on top (z-index 1000)
        const effectiveZIndex = isHeaderOrFooter ? 1000 : zIndex + 1

        // Header/footer cannot be dragged
        const handleMouseDown = isHeaderOrFooter
          ? undefined
          : (e: React.MouseEvent) => handleDragStart(e, element)

        // Cursor style for header/footer (no move cursor)
        const elementCursorStyle = isHeaderOrFooter ? 'cursor-default' : cursorStyle

        return (
          <div
            key={element.id}
            data-element-id={element.id}
            className={`absolute select-none ${elementCursorStyle}`}
            style={{
              left: leftPercent !== undefined ? `${leftPercent}%` : undefined,
              top: topPercent !== undefined ? `${topPercent}%` : undefined,
              bottom: bottomPos,
              width: widthStyle,
              height: `${heightPx}px`,
              transform: isHeaderOrFooter ? undefined : (transform || undefined),
              transformOrigin: 'top left',
              zIndex: effectiveZIndex,
              outline: selected || dragging || resizing ? '2px dashed #3b82f6' : 'none',
              outlineOffset: '2px',
              overflow: 'hidden',
            }}
            onClick={(e) => handleElementClick(e, element)}
            onDoubleClick={(e) => handleElementDoubleClick(e, element)}
            onMouseDown={handleMouseDown}
          >
            {renderElementContent(element, widthPx)}
            {renderResizeHandles(element, bounds)}
          </div>
        )
      })}
    </div>
  )
}

export default CustomLabelPreview
