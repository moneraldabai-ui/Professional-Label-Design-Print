import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BarcodeType } from '../types/barcode'

export type ZoomLevel = 50 | 75 | 100 | 150 | 200
export const ZOOM_LEVELS: ZoomLevel[] = [50, 75, 100, 150, 200]

interface LabelDimensions {
  width: number  // in mm
  height: number // in mm
}

interface LabelContent {
  // Text fields that appear on the label
  fields: Record<string, string>
  // Barcode settings
  barcodeType: BarcodeType
  barcodeData: string
}

interface LabelState {
  // Dimensions
  dimensions: LabelDimensions
  setDimensions: (dimensions: Partial<LabelDimensions>) => void

  // Zoom
  zoom: ZoomLevel
  setZoom: (zoom: ZoomLevel) => void

  // Content
  content: LabelContent
  setField: (key: string, value: string) => void
  setBarcodeType: (type: BarcodeType) => void
  setBarcodeData: (data: string) => void
  clearContent: () => void

  // Preset sizes
  presetSizes: { name: string; width: number; height: number }[]
  applyPreset: (index: number) => void
}

const defaultContent: LabelContent = {
  fields: {},
  barcodeType: 'code128',
  barcodeData: '',
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      // Default dimensions: 36mm x 86mm (portrait orientation)
      dimensions: {
        width: 36,
        height: 86,
      },

      setDimensions: (newDimensions) =>
        set((state) => ({
          dimensions: { ...state.dimensions, ...newDimensions },
        })),

      // Default zoom: 150%
      zoom: 150,

      setZoom: (zoom) => set({ zoom }),

      // Content
      content: defaultContent,

      setField: (key, value) =>
        set((state) => ({
          content: {
            ...state.content,
            fields: { ...state.content.fields, [key]: value },
          },
        })),

      setBarcodeType: (type) =>
        set((state) => ({
          content: { ...state.content, barcodeType: type },
        })),

      setBarcodeData: (data) =>
        set((state) => ({
          content: { ...state.content, barcodeData: data },
        })),

      clearContent: () => set({ content: defaultContent }),

      // Common label sizes (portrait orientation)
      presetSizes: [
        { name: '36mm × 86mm (Standard)', width: 36, height: 86 },
        { name: '25mm × 51mm (Small)', width: 25, height: 51 },
        { name: '25mm × 76mm (Medium)', width: 25, height: 76 },
        { name: '51mm × 102mm (Large)', width: 51, height: 102 },
        { name: '51mm × 51mm (Square)', width: 51, height: 51 },
        { name: '50mm × 100mm (Shipping)', width: 50, height: 100 },
      ],

      applyPreset: (index) => {
        const preset = get().presetSizes[index]
        if (preset) {
          set({
            dimensions: { width: preset.width, height: preset.height },
          })
        }
      },
    }),
    {
      name: 'label-studio-label-settings',
      version: 2,
      partialize: (state) => ({
        dimensions: state.dimensions,
        zoom: state.zoom,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v2: ensure dimensions default to 36x86 if missing
          if (!state.dimensions) {
            state.dimensions = { width: 36, height: 86 }
          }
          if (!state.zoom) {
            state.zoom = 150
          }
        }
        return state
      },
    }
  )
)
