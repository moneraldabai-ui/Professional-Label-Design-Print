import { create } from 'zustand'
import { TemplateElement } from './useCustomTemplateStore'

// Store preview DATA, not JSX - this avoids render-phase setState violations
interface PreviewProps {
  elements: TemplateElement[]
  fieldValues: Record<string, string>
  zoom: number
  onElementUpdate?: (id: string, updates: Partial<TemplateElement>) => void
  // Label appearance
  backgroundColor?: string
  backgroundOpacity?: number
}

interface PreviewState {
  previewProps: PreviewProps | null
  setPreviewProps: (props: PreviewProps | null) => void
  // Callback ref for element updates - stored separately to avoid re-renders
  elementUpdateCallback: ((id: string, updates: Partial<TemplateElement>) => void) | null
  setElementUpdateCallback: (callback: ((id: string, updates: Partial<TemplateElement>) => void) | null) => void
  // Callback ref for double-click on text elements (for inline editing)
  elementDoubleClickCallback: ((elementId: string) => void) | null
  setElementDoubleClickCallback: (callback: ((elementId: string) => void) | null) => void
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewProps: null,
  setPreviewProps: (props) => set({ previewProps: props }),
  elementUpdateCallback: null,
  setElementUpdateCallback: (callback) => set({ elementUpdateCallback: callback }),
  elementDoubleClickCallback: null,
  setElementDoubleClickCallback: (callback) => set({ elementDoubleClickCallback: callback }),
}))
