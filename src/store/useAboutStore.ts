import { create } from 'zustand'

interface AboutState {
  isAboutOpen: boolean
  openAbout: () => void
  closeAbout: () => void
}

export const useAboutStore = create<AboutState>((set) => ({
  isAboutOpen: false,
  openAbout: () => set({ isAboutOpen: true }),
  closeAbout: () => set({ isAboutOpen: false }),
}))
