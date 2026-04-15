import { useEffect, useRef } from 'react'
import { X, Printer, FileText, AlertCircle } from 'lucide-react'
import { useBatchPrintStore } from '../../store/useBatchPrintStore'
import { useLabelStore } from '../../store/useLabelStore'
import { usePreviewStore } from '../../store/usePreviewStore'
import { getLabelPixelSize } from '../../utils/units'
import { printBatch } from '../../utils/print'
import CustomLabelPreview from '../labels/CustomLabelPreview'

function BatchPrintModal() {
  const isOpen = useBatchPrintStore((s) => s.isOpen)
  const config = useBatchPrintStore((s) => s.config)
  const rawInput = useBatchPrintStore((s) => s.rawInput)
  const parsedLabels = useBatchPrintStore((s) => s.parsedLabels)
  const closeModal = useBatchPrintStore((s) => s.closeModal)
  const setRawInput = useBatchPrintStore((s) => s.setRawInput)
  const parseInput = useBatchPrintStore((s) => s.parseInput)

  const dimensions = useLabelStore((s) => s.dimensions)
  const zoom = useLabelStore((s) => s.zoom)
  // Get the current preview props to access elements for rendering
  const previewProps = usePreviewStore((s) => s.previewProps)
  const labelsContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parse input when it changes
  useEffect(() => {
    if (rawInput) {
      parseInput()
    }
  }, [rawInput, parseInput])

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen || !config) return null

  const { width, height } = getLabelPixelSize(dimensions.width, dimensions.height, zoom)
  const previewScale = 0.4 // Show labels at 40% size in preview list

  const handlePrint = () => {
    if (!labelsContainerRef.current || parsedLabels.length === 0) return

    const labelElements = labelsContainerRef.current.querySelectorAll('.batch-label-item')
    const elements = Array.from(labelElements) as HTMLElement[]

    printBatch(elements)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  // Render label preview using stored elements and the label's field values
  const renderLabelPreview = (fields: Record<string, string>) => {
    if (!previewProps) return null
    return (
      <CustomLabelPreview
        elements={previewProps.elements}
        fieldValues={fields}
        zoom={zoom}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-dark">Batch Print</h2>
            <p className="text-sm text-muted">
              {config.tabName} — {config.templateName}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-6 p-6 min-h-0 overflow-hidden">
          {/* Left: Input */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted" />
              <span className="text-sm font-medium text-dark">
                Paste data (one label per line)
              </span>
            </div>

            <div className="text-xs text-muted mb-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="font-medium">Format:</span>{' '}
              <code className="text-primary-600">{config.fieldNames.join(',')}</code>
            </div>

            <textarea
              ref={textareaRef}
              className="flex-1 w-full border border-border rounded-lg p-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={config.placeholder}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted">
                {parsedLabels.length} label{parsedLabels.length !== 1 ? 's' : ''} ready
              </span>
              {parsedLabels.length > 0 && (
                <button
                  onClick={() => setRawInput('')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-80 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-dark">Preview</span>
            </div>

            <div
              ref={labelsContainerRef}
              className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-4"
            >
              {parsedLabels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">No labels to preview</span>
                  <span className="text-xs opacity-70">Paste data on the left</span>
                </div>
              ) : (
                parsedLabels.map((label, index) => (
                  <div key={label.id} className="flex flex-col items-center">
                    <span className="text-xs text-muted mb-1">#{index + 1}</span>
                    <div
                      className="batch-label-item bg-white border border-gray-300 rounded shadow-sm overflow-hidden"
                      style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top center',
                        marginBottom: `${-height * (1 - previewScale)}px`,
                      }}
                    >
                      {renderLabelPreview(label.fields)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50 rounded-b-xl">
          <button
            onClick={closeModal}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={parsedLabels.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print {parsedLabels.length} Label{parsedLabels.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchPrintModal
