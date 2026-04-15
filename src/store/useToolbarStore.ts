import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToolbarMode = 'pinned' | 'floating'
export type ToolType = 'move' | 'select' | 'none'

interface ToolbarPosition {
  x: number
  y: number
}

interface SelectedElement {
  id: string
  rotation: number
  scale: number
  x: number
  y: number
  width: number
  height: number
  flipH: boolean
  flipV: boolean
  zIndex: number
  locked: boolean
}

interface ToolbarState {
  // Toolbar mode and position
  mode: ToolbarMode
  position: ToolbarPosition
  setMode: (mode: ToolbarMode) => void
  setPosition: (position: ToolbarPosition) => void
  toggleMode: () => void

  // Current tool
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void

  // Selected element
  selectedElement: SelectedElement | null
  setSelectedElement: (element: SelectedElement | null) => void
  updateSelectedElement: (updates: Partial<SelectedElement>) => void

  // Transform actions
  rotateElement: (degrees: number) => void
  setRotation: (degrees: number) => void
  scaleElement: (factor: number) => void
  flipHorizontal: () => void
  flipVertical: () => void

  // Alignment actions (these return the value, to be applied externally)
  // The actual alignment calculation depends on the canvas size

  // Arrange actions
  bringForward: () => void
  sendBackward: () => void
  duplicateElement: () => void
  deleteElement: () => void

  // Alignment actions (need label dimensions)
  alignLeft: () => void
  alignCenterH: () => void
  alignRight: () => void
  alignTop: () => void
  alignCenterV: () => void
  alignBottom: () => void

  // Label dimensions for alignment (set by preview component)
  labelDimensions: { width: number; height: number } | null
  setLabelDimensions: (dims: { width: number; height: number } | null) => void

  // Callback for external handlers
  onElementChange: ((element: SelectedElement | null) => void) | null
  setOnElementChange: (callback: ((element: SelectedElement | null) => void) | null) => void
  onDeleteElement: (() => void) | null
  setOnDeleteElement: (callback: (() => void) | null) => void
  onDuplicateElement: (() => void) | null
  setOnDuplicateElement: (callback: (() => void) | null) => void
  onToggleLock: (() => void) | null
  setOnToggleLock: (callback: (() => void) | null) => void
  toggleLock: () => void
}

export const useToolbarStore = create<ToolbarState>()(
  persist(
    (set, get) => ({
      // Default: pinned mode
      mode: 'pinned',
      position: { x: 0, y: 0 },

      setMode: (mode) => set({ mode }),
      setPosition: (position) => set({ position }),
      toggleMode: () => set((state) => ({
        mode: state.mode === 'pinned' ? 'floating' : 'pinned'
      })),

      // Tool selection
      activeTool: 'move',
      setActiveTool: (tool) => set({ activeTool: tool }),

      // Selected element management
      selectedElement: null,
      setSelectedElement: (element) => {
        set({ selectedElement: element })
        const callback = get().onElementChange
        if (callback) callback(element)
      },
      updateSelectedElement: (updates) => {
        const current = get().selectedElement
        if (current) {
          const updated = { ...current, ...updates }
          set({ selectedElement: updated })
          const callback = get().onElementChange
          if (callback) callback(updated)
        }
      },

      // Transform actions
      rotateElement: (degrees) => {
        const current = get().selectedElement
        if (current) {
          const newRotation = (current.rotation + degrees + 360) % 360
          get().updateSelectedElement({ rotation: newRotation })
        }
      },
      setRotation: (degrees) => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ rotation: degrees % 360 })
        }
      },
      scaleElement: (factor) => {
        const current = get().selectedElement
        if (current) {
          const newScale = Math.max(0.1, Math.min(5, current.scale * factor))
          get().updateSelectedElement({ scale: newScale })
        }
      },
      flipHorizontal: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ flipH: !current.flipH })
        }
      },
      flipVertical: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ flipV: !current.flipV })
        }
      },

      // Arrange actions
      bringForward: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ zIndex: current.zIndex + 1 })
        }
      },
      sendBackward: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ zIndex: Math.max(0, current.zIndex - 1) })
        }
      },
      duplicateElement: () => {
        const callback = get().onDuplicateElement
        if (callback) callback()
      },
      deleteElement: () => {
        const callback = get().onDeleteElement
        if (callback) callback()
        set({ selectedElement: null })
      },

      // Alignment
      labelDimensions: null,
      setLabelDimensions: (dims) => set({ labelDimensions: dims }),

      alignLeft: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ x: 0 })
        }
      },
      alignCenterH: () => {
        const current = get().selectedElement
        const dims = get().labelDimensions
        if (current && dims) {
          get().updateSelectedElement({ x: (dims.width - current.width) / 2 })
        }
      },
      alignRight: () => {
        const current = get().selectedElement
        const dims = get().labelDimensions
        if (current && dims) {
          get().updateSelectedElement({ x: dims.width - current.width })
        }
      },
      alignTop: () => {
        const current = get().selectedElement
        if (current) {
          get().updateSelectedElement({ y: 0 })
        }
      },
      alignCenterV: () => {
        const current = get().selectedElement
        const dims = get().labelDimensions
        if (current && dims) {
          get().updateSelectedElement({ y: (dims.height - current.height) / 2 })
        }
      },
      alignBottom: () => {
        const current = get().selectedElement
        const dims = get().labelDimensions
        if (current && dims) {
          get().updateSelectedElement({ y: dims.height - current.height })
        }
      },

      // Callbacks
      onElementChange: null,
      setOnElementChange: (callback) => set({ onElementChange: callback }),
      onDeleteElement: null,
      setOnDeleteElement: (callback) => set({ onDeleteElement: callback }),
      onDuplicateElement: null,
      setOnDuplicateElement: (callback) => set({ onDuplicateElement: callback }),
      onToggleLock: null,
      setOnToggleLock: (callback) => set({ onToggleLock: callback }),
      toggleLock: () => {
        const callback = get().onToggleLock
        if (callback) callback()
      },
    }),
    {
      name: 'label-studio-toolbar',
      version: 2,
      partialize: (state) => ({
        mode: state.mode,
        position: state.position,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v2: toolbar is now always pinned, clear stale floating position
          state.mode = 'pinned'
          state.position = { x: 0, y: 0 }
        }
        return state
      },
    }
  )
)
