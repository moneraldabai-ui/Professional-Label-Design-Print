import { useEffect, useRef, useState } from 'react'
import bwipjs from 'bwip-js'
import QRCodeStyling, {
  DotType,
  CornerSquareType,
  CornerDotType,
} from 'qr-code-styling'
import {
  BarcodeType,
  BARCODE_CONFIGS,
  validateBarcodeData,
} from '../../types/barcode'
import {
  QrDotsStyle,
  QrCornersStyle,
  QrCornersShape,
} from '../../store/useCustomTemplateStore'

interface BarcodeRendererProps {
  data: string
  type: BarcodeType
  scale?: number
  height?: number
  className?: string
  // QR Code styling props
  qrDotsStyle?: QrDotsStyle
  qrCornersStyle?: QrCornersStyle
  qrCornersShape?: QrCornersShape
}

// Map our style types to qr-code-styling types
function mapDotsStyle(style: QrDotsStyle): DotType {
  const map: Record<QrDotsStyle, DotType> = {
    'square': 'square',
    'rounded': 'rounded',
    'dots': 'dots',
    'extra-rounded': 'extra-rounded',
    'classy': 'classy',
    'classy-rounded': 'classy-rounded',
  }
  return map[style] || 'square'
}

function mapCornersStyle(style: QrCornersStyle): CornerSquareType {
  const map: Record<QrCornersStyle, CornerSquareType> = {
    'square': 'square',
    'extra-rounded': 'extra-rounded',
    'dot': 'dot',
  }
  return map[style] || 'square'
}

function mapCornersShape(style: QrCornersShape): CornerDotType {
  const map: Record<QrCornersShape, CornerDotType> = {
    'square': 'square',
    'dot': 'dot',
  }
  return map[style] || 'square'
}

function BarcodeRenderer({
  data,
  type,
  scale: propScale,
  height: propHeight,
  className = '',
  qrDotsStyle = 'square',
  qrCornersStyle = 'square',
  qrCornersShape = 'square',
}: BarcodeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isQrReady, setIsQrReady] = useState(false)

  // Cleanup QR code instance on unmount
  useEffect(() => {
    return () => {
      qrCodeRef.current = null
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = ''
      }
    }
  }, [])

  // Handle QR Code with qr-code-styling
  useEffect(() => {
    if (type !== 'qrcode') return

    const config = BARCODE_CONFIGS[type]
    if (!config) {
      setError(`Unsupported barcode type: ${type}`)
      return
    }

    const validation = validateBarcodeData(data, type)
    if (!validation.valid) {
      setError(validation.error || 'Invalid data')
      setIsQrReady(false)
      return
    }

    if (!qrContainerRef.current) return

    // Clear previous QR code
    qrContainerRef.current.innerHTML = ''

    // Calculate size based on scale (default 3, base size 40)
    const scale = propScale ?? config.scale ?? 3
    const size = Math.round(40 * scale)

    try {
      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        type: 'svg',
        data: data.trim(),
        dotsOptions: {
          color: '#000000',
          type: mapDotsStyle(qrDotsStyle),
        },
        cornersSquareOptions: {
          color: '#000000',
          type: mapCornersStyle(qrCornersStyle),
        },
        cornersDotOptions: {
          color: '#000000',
          type: mapCornersShape(qrCornersShape),
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        qrOptions: {
          errorCorrectionLevel: 'M',
        },
      })

      qrCodeRef.current = qrCode
      qrCode.append(qrContainerRef.current)
      setError(null)
      setIsQrReady(true)
    } catch (err) {
      console.error('QR Code render error:', err)
      setError(err instanceof Error ? err.message : 'Failed to render QR code')
      setIsQrReady(false)
    }
  }, [data, type, propScale, qrDotsStyle, qrCornersStyle, qrCornersShape])

  // Handle other barcodes with bwip-js
  useEffect(() => {
    if (type === 'qrcode') return

    try {
      const config = BARCODE_CONFIGS[type]

      // Guard: unknown barcode type (e.g. corrupted localStorage)
      if (!config) {
        setError(`Unsupported barcode type: ${type}`)
        setImageUrl(null)
        return
      }

      const validation = validateBarcodeData(data, type)

      if (!validation.valid) {
        setError(validation.error || 'Invalid data')
        setImageUrl(null)
        return
      }

      if (!canvasRef.current) return

      // Determine scale and height
      const scale = propScale ?? config.scale ?? 2
      const height = propHeight ?? config.height ?? 10

      // bwip-js options
      const options: bwipjs.RenderOptions = {
        bcid: config.bcid,
        text: data.trim(),
        scale,
        includetext: config.includeText ?? false,
        textxalign: 'center',
      }

      // Add height for 1D barcodes (not for 2D like DataMatrix, PDF417)
      if (!['datamatrix', 'pdf417'].includes(type)) {
        options.height = height
      }

      // Add text size if showing text
      if (config.includeText && config.textSize) {
        options.textsize = config.textSize
      }

      // Render to canvas
      bwipjs.toCanvas(canvasRef.current, options)

      // Convert to data URL for display
      const url = canvasRef.current.toDataURL('image/png')
      setImageUrl(url)
      setError(null)
    } catch (err) {
      console.error('Barcode render error:', err)
      setError(err instanceof Error ? err.message : 'Failed to render barcode')
      setImageUrl(null)
    }
  }, [data, type, propScale, propHeight])

  // Determine label for display
  const typeLabel = BARCODE_CONFIGS[type]?.label ?? type

  // Render QR code
  if (type === 'qrcode') {
    return (
      <div className={`barcode-renderer ${className}`}>
        {error ? (
          <div className="flex items-center justify-center text-center p-2">
            <div>
              <span className="text-xs text-red-500 block">{error}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {typeLabel}
              </span>
            </div>
          </div>
        ) : (
          <div
            ref={qrContainerRef}
            className={`qr-code-container ${!isQrReady ? 'opacity-0' : ''}`}
            style={{ lineHeight: 0 }}
          />
        )}
        {!isQrReady && !error && (
          <div className="flex items-center justify-center p-2">
            <span className="text-xs text-muted">Generating...</span>
          </div>
        )}
      </div>
    )
  }

  // Render other barcodes
  return (
    <div className={`barcode-renderer ${className}`}>
      {/* Hidden canvas for bwip-js rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Display result */}
      {error ? (
        <div className="flex items-center justify-center text-center p-2">
          <div>
            <span className="text-xs text-red-500 block">{error}</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              {typeLabel}
            </span>
          </div>
        </div>
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={`${typeLabel} barcode`}
          className="max-w-full h-auto"
        />
      ) : (
        <div className="flex items-center justify-center p-2">
          <span className="text-xs text-muted">Generating...</span>
        </div>
      )}
    </div>
  )
}

export default BarcodeRenderer
