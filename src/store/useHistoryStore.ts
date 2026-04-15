import { create } from 'zustand'
import { TemplateElement } from './useCustomTemplateStore'

interface HistoryEntry {
  elements: TemplateElement[]
  timestamp: number
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  // Push current state onto history stack before making a change
  pushState: (elements: TemplateElement[]) => void
  // Undo: pop from past, push current to future, return restored elements
  undo: (currentElements: TemplateElement[]) => TemplateElement[] | null
  // Redo: pop from future, push current to past, return restored elements
  redo: (currentElements: TemplateElement[]) => TemplateElement[] | null
  // Check capabilities
  canUndo: () => boolean
  canRedo: () => boolean
  // Clear history
  clear: () => void
}

const MAX_HISTORY = 50

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],

  pushState: (elements) => {
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY + 1),
        { elements: structuredClone(elements), timestamp: Date.now() },
      ],
      future: [], // clear redo stack on new action
    }))
  },

  undo: (currentElements) => {
    const { past } = get()
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [
        { elements: structuredClone(currentElements), timestamp: Date.now() },
        ...state.future,
      ],
    }))
    return structuredClone(previous.elements)
  },

  redo: (currentElements) => {
    const { future } = get()
    if (future.length === 0) return null

    const next = future[0]
    set((state) => ({
      past: [
        ...state.past,
        { elements: structuredClone(currentElements), timestamp: Date.now() },
      ],
      future: state.future.slice(1),
    }))
    return structuredClone(next.elements)
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}))
