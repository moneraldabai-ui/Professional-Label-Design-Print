import { ReactNode, useMemo } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2 } from 'lucide-react'
import { useLabelStore, ZoomLevel, ZOOM_LEVELS } from '../../store/useLabelStore'
import { usePreviewStore } from '../../store/usePreviewStore'
import { useHistoryStore } from '../../store/useHistoryStore'
import LabelPreview from '../preview/LabelPreview'
import PreviewToolbar from '../toolbar/PreviewToolbar'
import CustomLabelPreview from '../labels/CustomLabelPreview'

interface TwoPanelProps {
  children: ReactNode
}

function TwoPanel({ children }: TwoPanelProps) {
  const zoom = useLabelStore((s) => s.zoom)
  const setZoom = useLabelStore((s) => s.setZoom)
  const previewProps = usePreviewStore((s) => s.previewProps)
  const elementUpdateCallback = usePreviewStore((s) => s.elementUpdateCallback)
  const elementDoubleClickCallback = usePreviewStore((s) => s.elementDoubleClickCallback)
  const canUndo = useHistoryStore((s) => s.canUndo)
  const canRedo = useHistoryStore((s) => s.canRedo)

  // Memoize the preview content to avoid unnecessary re-renders
  const previewContent = useMemo(() => {
    if (!previewProps || previewProps.elements.length === 0) {
      return null
    }
    return (
      <CustomLabelPreview
        elements={previewProps.elements}
        fieldValues={previewProps.fieldValues}
        zoom={previewProps.zoom}
        onElementUpdate={elementUpdateCallback || undefined}
        onElementDoubleClick={elementDoubleClickCallback || undefined}
      />
    )
  }, [previewProps, elementUpdateCallback, elementDoubleClickCallback])

  const currentZoomIndex = ZOOM_LEVELS.indexOf(zoom)

  const handleZoomIn = () => {
    if (currentZoomIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentZoomIndex + 1])
    }
  }

  const handleZoomOut = () => {
    if (currentZoomIndex > 0) {
      setZoom(ZOOM_LEVELS[currentZoomIndex - 1])
    }
  }

  const handleReset = () => {
    setZoom(150)
  }

  // Undo/redo are triggered via custom events (handled by CustomTab)
  const handleUndo = () => {
    window.dispatchEvent(new CustomEvent('label-studio-undo'))
  }

  const handleRedo = () => {
    window.dispatchEvent(new CustomEvent('label-studio-redo'))
  }

  const undoAvailable = canUndo()
  const redoAvailable = canRedo()

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Controls */}
      <aside className="w-sidebar bg-white border-r border-border flex flex-col overflow-hidden shrink-0">
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </aside>

      {/* Right Panel - Preview */}
      <main className="flex-1 flex flex-col bg-panel overflow-hidden">
        {/* Preview Header */}
        <div className="h-12 bg-white border-b border-border flex items-center justify-between px-4 shrink-0">
          <span className="text-sm font-medium text-dark">Label Preview</span>
          <div className="flex items-center gap-1">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={!undoAvailable}
              className={`p-1.5 rounded transition-colors ${
                !undoAvailable
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-muted hover:text-dark hover:bg-gray-100'
              }`}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            {/* Redo */}
            <button
              onClick={handleRedo}
              disabled={!redoAvailable}
              className={`p-1.5 rounded transition-colors ${
                !redoAvailable
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-muted hover:text-dark hover:bg-gray-100'
              }`}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-border mx-2" />

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={currentZoomIndex === 0}
              className={`p-1.5 rounded transition-colors ${
                currentZoomIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-muted hover:text-dark hover:bg-gray-100'
              }`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom Level Dropdown */}
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value) as ZoomLevel)}
              className="text-xs text-dark font-medium px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary-500 focus:outline-none bg-transparent cursor-pointer min-w-[60px] text-center"
            >
              {ZOOM_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}%
                </option>
              ))}
            </select>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={currentZoomIndex === ZOOM_LEVELS.length - 1}
              className={`p-1.5 rounded transition-colors ${
                currentZoomIndex === ZOOM_LEVELS.length - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-muted hover:text-dark hover:bg-gray-100'
              }`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-border mx-2" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-gray-100 text-muted hover:text-dark transition-colors"
              title="Reset to 150%"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Canvas Area */}
        <div
          className="flex-1 flex items-center justify-center p-8 overflow-auto relative"
        >
          <LabelPreview
            backgroundColor={previewProps?.backgroundColor}
            backgroundOpacity={previewProps?.backgroundOpacity}
          >
            {previewContent}
          </LabelPreview>

          {/* Preview Toolbar */}
          <PreviewToolbar />
        </div>

        {/* Preview Footer */}
        <div className="h-10 bg-white border-t border-border flex items-center justify-center px-4 shrink-0">
          <span className="text-xs text-muted">
            Zebra ZD421 - 203 DPI - Direct Thermal
          </span>
        </div>
      </main>
    </div>
  )
}

export default TwoPanel
