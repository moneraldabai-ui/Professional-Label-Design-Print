import { create } from 'zustand'

interface HelpState {
  isHelpOpen: boolean
  activeTab: number
  openHelp: (tab?: number) => void
  closeHelp: () => void
  setActiveTab: (tab: number) => void
}

export const useHelpStore = create<HelpState>((set) => ({
  isHelpOpen: false,
  activeTab: 0,
  openHelp: (tab = 0) => set({ isHelpOpen: true, activeTab: tab }),
  closeHelp: () => set({ isHelpOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
