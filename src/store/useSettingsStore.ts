import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TabId } from '../App'
import { BarcodeType } from '../types/barcode'
import { ZoomLevel, useLabelStore } from './useLabelStore'

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

interface CompanySettings {
  companyName: string
  logoDataUrl: string | null
  defaultTab: TabId
  dateFormat: DateFormat
}

interface LabelDefaults {
  defaultWidth: number
  defaultHeight: number
  defaultBarcodeType: BarcodeType
  defaultZoom: ZoomLevel
}

interface SettingsState {
  // Company Settings
  company: CompanySettings

  // Label Defaults
  labelDefaults: LabelDefaults

  // Settings modal state
  isSettingsOpen: boolean

  // Actions
  openSettings: () => void
  closeSettings: () => void
  updateCompanySettings: (settings: Partial<CompanySettings>) => void
  updateLabelDefaults: (defaults: Partial<LabelDefaults>) => void
  setLogo: (dataUrl: string | null) => void
  clearAllData: () => void
  exportSettings: () => string
  importSettings: (json: string) => boolean
}

const DEFAULT_COMPANY: CompanySettings = {
  companyName: 'ACME Corporation',
  logoDataUrl: null,
  defaultTab: 'it',
  dateFormat: 'MM/DD/YYYY',
}

const DEFAULT_LABEL_DEFAULTS: LabelDefaults = {
  defaultWidth: 36,
  defaultHeight: 86,
  defaultBarcodeType: 'code128',
  defaultZoom: 150,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      company: DEFAULT_COMPANY,
      labelDefaults: DEFAULT_LABEL_DEFAULTS,
      isSettingsOpen: false,

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      updateCompanySettings: (settings) =>
        set((state) => ({
          company: { ...state.company, ...settings },
        })),

      updateLabelDefaults: (defaults) => {
        set((state) => ({
          labelDefaults: { ...state.labelDefaults, ...defaults },
        }))

        // Also apply to current label immediately
        const labelStore = useLabelStore.getState()
        if (defaults.defaultWidth !== undefined || defaults.defaultHeight !== undefined) {
          labelStore.setDimensions({
            ...(defaults.defaultWidth !== undefined && { width: defaults.defaultWidth }),
            ...(defaults.defaultHeight !== undefined && { height: defaults.defaultHeight }),
          })
        }
        if (defaults.defaultZoom !== undefined) {
          labelStore.setZoom(defaults.defaultZoom)
        }
      },

      setLogo: (dataUrl) =>
        set((state) => ({
          company: { ...state.company, logoDataUrl: dataUrl },
        })),

      clearAllData: () => {
        // Clear all persisted store keys
        localStorage.removeItem('label-studio-settings')
        localStorage.removeItem('label-studio-label-settings')
        localStorage.removeItem('label-studio-label-settings-v2') // legacy key
        localStorage.removeItem('label-studio-custom-departments')
        localStorage.removeItem('label-studio-fixed-departments')
        localStorage.removeItem('label-studio-toolbar')

        // Reset to defaults
        set({
          company: DEFAULT_COMPANY,
          labelDefaults: DEFAULT_LABEL_DEFAULTS,
        })

        // Reload to reset all stores
        window.location.reload()
      },

      exportSettings: () => {
        const state = get()
        const exportData = {
          version: 2,
          exportedAt: new Date().toISOString(),
          company: state.company,
          labelDefaults: state.labelDefaults,
          customDepartments: localStorage.getItem('label-studio-custom-departments') || '{}',
        }
        return JSON.stringify(exportData, null, 2)
      },

      importSettings: (json) => {
        try {
          const data = JSON.parse(json)
          if (!data.version || !data.company || !data.labelDefaults) {
            return false
          }

          set({
            company: { ...DEFAULT_COMPANY, ...data.company },
            labelDefaults: { ...DEFAULT_LABEL_DEFAULTS, ...data.labelDefaults },
          })

          if (data.customDepartments) {
            localStorage.setItem('label-studio-custom-departments', data.customDepartments)
          }

          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'label-studio-settings',
      version: 2,
      partialize: (state) => ({
        company: state.company,
        labelDefaults: state.labelDefaults,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v2: ensure defaults exist for any missing company/labelDefaults fields
          const company = (state.company || {}) as Record<string, unknown>
          if (!company.dateFormat) company.dateFormat = 'MM/DD/YYYY'
          state.company = company

          const labelDefaults = (state.labelDefaults || {}) as Record<string, unknown>
          if (!labelDefaults.defaultZoom) labelDefaults.defaultZoom = 150
          state.labelDefaults = labelDefaults
        }
        return state
      },
    }
  )
)

// Helper function to format dates based on settings
export function formatDate(dateStr: string, format: DateFormat): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      default:
        return dateStr
    }
  } catch {
    return dateStr
  }
}

// Helper to get today's date formatted according to current settings
export function getTodayFormatted(): string {
  const format = useSettingsStore.getState().company.dateFormat
  const today = new Date()
  const day = today.getDate().toString().padStart(2, '0')
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const year = today.getFullYear()

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    default:
      return `${month}/${day}/${year}`
  }
}

// Helper to get the date format pattern for placeholder text
export function getDateFormatPattern(): string {
  return useSettingsStore.getState().company.dateFormat
}
