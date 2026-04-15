import { useState, useRef } from 'react'
import {
  Move,
  MousePointer2,
  RotateCcw,
  RotateCw,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Lock,
  LockOpen,
} from 'lucide-react'
import { useToolbarStore } from '../../store/useToolbarStore'

interface ToolbarButtonProps {
  icon: React.ReactNode
  tooltip: string
  description?: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

function ToolbarButton({ icon, tooltip, description, onClick, disabled = false, active = false }: ToolbarButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-7 h-7 flex items-center justify-center rounded transition-all
          ${disabled
            ? 'text-gray-300 cursor-not-allowed opacity-40'
            : active
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded whitespace-nowrap shadow-lg">
            <div className="font-medium">{tooltip}</div>
            {description && (
              <div className="text-gray-400 text-[10px] mt-0.5">{description}</div>
            )}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarDivider() {
  return <div className="h-px bg-gray-200 mx-1.5 my-1" />
}

interface DeleteButtonProps {
  disabled: boolean
  onDelete: () => void
}

function DeleteButton({ disabled, onDelete }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = () => {
    if (disabled) return
    if (showConfirm) {
      // Second click confirms
      setShowConfirm(false)
      onDelete()
    } else {
      setShowConfirm(true)
      // Auto-dismiss after 3 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => { setShowTooltip(false) }}
        className={`
          w-7 h-7 flex items-center justify-center rounded transition-all
          ${disabled
            ? 'text-gray-300 cursor-not-allowed opacity-40'
            : showConfirm
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
          }
        `}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {/* Confirmation tooltip */}
      {showConfirm && (
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-red-600 text-white text-xs px-2.5 py-1.5 rounded whitespace-nowrap shadow-lg font-medium">
            Click again to delete
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-red-600" />
          </div>
        </div>
      )}
      {/* Normal tooltip */}
      {showTooltip && !showConfirm && !disabled && (
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded whitespace-nowrap shadow-lg">
            <div className="font-medium">Delete Element</div>
            <div className="text-gray-400 text-[10px] mt-0.5">Remove selected element</div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function PreviewToolbar() {
  const activeTool = useToolbarStore((s) => s.activeTool)
  const setActiveTool = useToolbarStore((s) => s.setActiveTool)
  const selectedElement = useToolbarStore((s) => s.selectedElement)
  const rotateElement = useToolbarStore((s) => s.rotateElement)
  const scaleElement = useToolbarStore((s) => s.scaleElement)
  const flipHorizontal = useToolbarStore((s) => s.flipHorizontal)
  const flipVertical = useToolbarStore((s) => s.flipVertical)
  const alignLeft = useToolbarStore((s) => s.alignLeft)
  const alignCenterH = useToolbarStore((s) => s.alignCenterH)
  const alignRight = useToolbarStore((s) => s.alignRight)
  const alignTop = useToolbarStore((s) => s.alignTop)
  const alignCenterV = useToolbarStore((s) => s.alignCenterV)
  const alignBottom = useToolbarStore((s) => s.alignBottom)
  const bringForward = useToolbarStore((s) => s.bringForward)
  const sendBackward = useToolbarStore((s) => s.sendBackward)
  const duplicateElement = useToolbarStore((s) => s.duplicateElement)
  const deleteElement = useToolbarStore((s) => s.deleteElement)
  const toggleLock = useToolbarStore((s) => s.toggleLock)

  const hasSelection = selectedElement !== null
  const isLocked = selectedElement?.locked ?? false

  // Push history before discrete toolbar actions
  const withHistory = (action: () => void) => () => {
    window.dispatchEvent(new CustomEvent('label-studio-push-history'))
    action()
  }

  return (
    <div
      className={`
        w-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200
        flex flex-col items-center py-1.5 z-40
        absolute right-3 top-1/2 -translate-y-1/2
      `}
    >
      {/* Group 1: Pointer Tools */}
      <div className="py-0.5 space-y-0.5">
        <ToolbarButton
          icon={<Move className="w-3.5 h-3.5" />}
          tooltip="Move Tool"
          description="Drag elements freely inside the label"
          onClick={() => setActiveTool(activeTool === 'move' ? 'none' : 'move')}
          active={activeTool === 'move'}
        />
        <ToolbarButton
          icon={<MousePointer2 className="w-3.5 h-3.5" />}
          tooltip="Select Tool"
          description="Click to select and view properties"
          onClick={() => setActiveTool(activeTool === 'select' ? 'none' : 'select')}
          active={activeTool === 'select'}
        />
      </div>

      <ToolbarDivider />

      {/* Group 2: Rotate */}
      <div className="py-0.5 space-y-0.5">
        <ToolbarButton
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          tooltip="Rotate Left 15°"
          description="Rotate selected element counter-clockwise"
          onClick={withHistory(() => rotateElement(-15))}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          tooltip="Rotate 90°"
          description="Rotate element by 90° (0→90→180→270)"
          onClick={() => window.dispatchEvent(new CustomEvent('label-studio-rotate-90'))}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<RotateCw className="w-3.5 h-3.5" />}
          tooltip="Rotate Right 15°"
          description="Rotate selected element clockwise"
          onClick={withHistory(() => rotateElement(15))}
          disabled={!hasSelection || isLocked}
        />
      </div>

      <ToolbarDivider />

      {/* Group 3: Flip & Scale */}
      <div className="py-0.5 space-y-0.5">
        <ToolbarButton
          icon={<FlipHorizontal className="w-3.5 h-3.5" />}
          tooltip="Flip Horizontal"
          description="Mirror element on horizontal axis"
          onClick={withHistory(flipHorizontal)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<FlipVertical className="w-3.5 h-3.5" />}
          tooltip="Flip Vertical"
          description="Mirror element on vertical axis"
          onClick={withHistory(flipVertical)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          tooltip="Scale Up"
          description="Increase element size by 10%"
          onClick={withHistory(() => scaleElement(1.1))}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<ZoomOut className="w-3.5 h-3.5" />}
          tooltip="Scale Down"
          description="Decrease element size by 10%"
          onClick={withHistory(() => scaleElement(0.9))}
          disabled={!hasSelection || isLocked}
        />
      </div>

      <ToolbarDivider />

      {/* Group 4: Alignment */}
      <div className="py-0.5 space-y-0.5">
        <ToolbarButton
          icon={<AlignLeft className="w-3.5 h-3.5" />}
          tooltip="Align Left"
          description="Snap element to left edge"
          onClick={withHistory(alignLeft)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<AlignCenter className="w-3.5 h-3.5" />}
          tooltip="Align Center Horizontal"
          description="Center element horizontally"
          onClick={withHistory(alignCenterH)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<AlignRight className="w-3.5 h-3.5" />}
          tooltip="Align Right"
          description="Snap element to right edge"
          onClick={withHistory(alignRight)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<AlignStartVertical className="w-3.5 h-3.5" />}
          tooltip="Align Top"
          description="Snap element to top edge"
          onClick={withHistory(alignTop)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<AlignCenterVertical className="w-3.5 h-3.5" />}
          tooltip="Align Center Vertical"
          description="Center element vertically"
          onClick={withHistory(alignCenterV)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<AlignEndVertical className="w-3.5 h-3.5" />}
          tooltip="Align Bottom"
          description="Snap element to bottom edge"
          onClick={withHistory(alignBottom)}
          disabled={!hasSelection || isLocked}
        />
      </div>

      <ToolbarDivider />

      {/* Group 5: Arrange & Actions */}
      <div className="py-0.5 space-y-0.5">
        <ToolbarButton
          icon={<ArrowUp className="w-3.5 h-3.5" />}
          tooltip="Bring Forward"
          description="Move element one layer up"
          onClick={withHistory(bringForward)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<ArrowDown className="w-3.5 h-3.5" />}
          tooltip="Send Backward"
          description="Move element one layer down"
          onClick={withHistory(sendBackward)}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={<Copy className="w-3.5 h-3.5" />}
          tooltip="Duplicate Element"
          description="Copy element with a small offset"
          onClick={duplicateElement}
          disabled={!hasSelection || isLocked}
        />
        <ToolbarButton
          icon={isLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
          tooltip={isLocked ? "Unlock Element" : "Lock Element"}
          description={isLocked ? "Allow editing (Ctrl+L)" : "Prevent accidental edits (Ctrl+L)"}
          onClick={toggleLock}
          disabled={!hasSelection}
          active={isLocked}
        />
        <DeleteButton
          disabled={!hasSelection || isLocked}
          onDelete={deleteElement}
        />
      </div>
    </div>
  )
}
