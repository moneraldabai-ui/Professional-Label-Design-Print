import { create } from 'zustand'

// Store only DATA, not ReactNode - JSX is created at render time in BatchPrintModal
export interface BatchLabelData {
  id: string
  fields: Record<string, string>
  index: number
}

interface BatchPrintConfig {
  tabName: string
  templateName: string
  fieldNames: string[]
  placeholder: string
}

interface BatchPrintState {
  isOpen: boolean
  config: BatchPrintConfig | null
  rawInput: string
  parsedLabels: BatchLabelData[]

  openModal: (config: BatchPrintConfig) => void
  closeModal: () => void
  setRawInput: (input: string) => void
  parseInput: () => void
}

export const useBatchPrintStore = create<BatchPrintState>((set, get) => ({
  isOpen: false,
  config: null,
  rawInput: '',
  parsedLabels: [],

  openModal: (config) =>
    set({
      isOpen: true,
      config,
      rawInput: '',
      parsedLabels: [],
    }),

  closeModal: () =>
    set({
      isOpen: false,
      config: null,
      rawInput: '',
      parsedLabels: [],
    }),

  setRawInput: (input) => set({ rawInput: input }),

  parseInput: () => {
    const { rawInput, config } = get()
    if (!config) return

    const lines = rawInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const labels: BatchLabelData[] = lines.map((line, index) => {
      const values = line.split(',').map((v) => v.trim())
      const fields: Record<string, string> = {}

      config.fieldNames.forEach((name, i) => {
        fields[name] = values[i] || ''
      })

      return {
        id: `label-${index}`,
        fields,
        index,
      }
    })

    set({ parsedLabels: labels })
  },
}))
