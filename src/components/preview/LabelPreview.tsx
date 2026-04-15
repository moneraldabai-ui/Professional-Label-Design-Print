import { ReactNode, forwardRef, useMemo } from 'react'
import { useLabelStore } from '../../store/useLabelStore'
import { getLabelPixelSize, formatDimensions } from '../../utils/units'

interface LabelPreviewProps {
  children?: ReactNode
  backgroundColor?: string
  backgroundOpacity?: number // 0-100
}

const LabelPreview = forwardRef<HTMLDivElement, LabelPreviewProps>(
  function LabelPreview({ children, backgroundColor = '#ffffff', backgroundOpacity = 100 }, ref) {
    const dimensions = useLabelStore((s) => s.dimensions)
    const zoom = useLabelStore((s) => s.zoom)
    const { width, height } = getLabelPixelSize(dimensions.width, dimensions.height, zoom)

    // Convert opacity from 0-100 to 0-1
    const opacityValue = backgroundOpacity / 100

    // Checkerboard pattern for transparent backgrounds
    const checkerboardStyle = useMemo(() => {
      if (backgroundOpacity >= 100) return {}
      return {
        backgroundImage: `
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)
        `,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        backgroundColor: '#fff',
      }
    }, [backgroundOpacity])

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Label Card */}
        <div
          className="bg-white rounded shadow-lg transition-all duration-200 ease-out"
          style={{
            padding: '3px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          }}
        >
          {/* The actual label */}
          <div
            ref={ref}
            id="label-preview-content"
            className="border-2 border-gray-400 rounded-sm relative overflow-hidden transition-all duration-200 ease-out"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
              ...checkerboardStyle,
            }}
          >
            {/* Background color overlay with opacity */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: backgroundColor,
                opacity: opacityValue,
              }}
            />
            {/* Label content */}
            {children || (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-muted select-none">
                  Enter data to preview
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dimensions Display */}
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-dark font-medium">
            {formatDimensions(dimensions.width, dimensions.height)}
          </span>
          <span className="text-muted">at {zoom}% zoom</span>
        </div>
      </div>
    )
  }
)

export default LabelPreview
