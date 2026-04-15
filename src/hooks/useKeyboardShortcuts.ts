import { useEffect, useCallback } from 'react'
import { useToolbarStore } from '../store/useToolbarStore'
import { useHelpStore } from '../store/useHelpStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAboutStore } from '../store/useAboutStore'
import { printCurrentLabel } from '../utils/print'
import { triggerLockedToast } from '../components/LockedToast'

/**
 * Check if the user is currently typing in an input field
 */
function isTypingInInput(): boolean {
  const activeElement = document.activeElement
  if (!activeElement) return false

  const tagName = activeElement.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  // Check for contenteditable
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true
  }

  return false
}

/**
 * Global keyboard shortcuts hook
 * Call this once in App.tsx to enable shortcuts globally
 */
export function useKeyboardShortcuts() {
  const selectedElement = useToolbarStore((s) => s.selectedElement)
  const setSelectedElement = useToolbarStore((s) => s.setSelectedElement)
  const updateSelectedElement = useToolbarStore((s) => s.updateSelectedElement)
  const deleteElement = useToolbarStore((s) => s.deleteElement)
  const duplicateElement = useToolbarStore((s) => s.duplicateElement)
  const toggleLock = useToolbarStore((s) => s.toggleLock)

  const openHelp = useHelpStore((s) => s.openHelp)
  const closeHelp = useHelpStore((s) => s.closeHelp)
  const isHelpOpen = useHelpStore((s) => s.isHelpOpen)

  const closeSettings = useSettingsStore((s) => s.closeSettings)
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen)

  const closeAbout = useAboutStore((s) => s.closeAbout)
  const isAboutOpen = useAboutStore((s) => s.isAboutOpen)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey

    // Always allow Escape to close modals
    if (key === 'escape') {
      if (isHelpOpen) {
        closeHelp()
        e.preventDefault()
        return
      }
      if (isSettingsOpen) {
        closeSettings()
        e.preventDefault()
        return
      }
      if (isAboutOpen) {
        closeAbout()
        e.preventDefault()
        return
      }
      // Deselect element
      if (selectedElement) {
        setSelectedElement(null)
        e.preventDefault()
        return
      }
      return
    }

    // ? key opens help (without modifier, not in input)
    if (key === '?' && !isTypingInInput()) {
      openHelp(1) // Open to keyboard shortcuts tab
      e.preventDefault()
      return
    }

    // Don't process shortcuts when typing in input fields
    if (isTypingInInput()) {
      return
    }

    // Don't process shortcuts when modals are open (except Escape handled above)
    if (isHelpOpen || isSettingsOpen || isAboutOpen) {
      return
    }

    // Ctrl+Z — Undo
    if (isCtrl && key === 'z' && !isShift) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('label-studio-undo'))
      return
    }

    // Ctrl+Y or Ctrl+Shift+Z — Redo
    if ((isCtrl && key === 'y') || (isCtrl && isShift && key === 'z')) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('label-studio-redo'))
      return
    }

    // Ctrl+P — Print
    if (isCtrl && key === 'p') {
      e.preventDefault()
      printCurrentLabel()
      return
    }

    // Ctrl+S — Save toast
    if (isCtrl && key === 's') {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('label-studio-save'))
      return
    }

    // Ctrl+L — Toggle lock on selected element
    if (isCtrl && key === 'l') {
      e.preventDefault()
      if (selectedElement) {
        toggleLock()
      }
      return
    }

    // Ctrl+D — Duplicate selected element
    if (isCtrl && key === 'd') {
      e.preventDefault()
      if (selectedElement) {
        if (selectedElement.locked) {
          triggerLockedToast()
          return
        }
        duplicateElement()
      }
      return
    }

    // Ctrl+A — Select all elements (dispatch event for workspace to handle)
    if (isCtrl && key === 'a') {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('label-studio-select-all'))
      return
    }

    // Delete / Backspace — Delete selected element
    if ((key === 'delete' || key === 'backspace') && selectedElement) {
      e.preventDefault()
      if (selectedElement.locked) {
        triggerLockedToast()
        return
      }
      deleteElement()
      return
    }

    // Arrow keys — Nudge element
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && selectedElement) {
      e.preventDefault()
      if (selectedElement.locked) {
        triggerLockedToast()
        return
      }
      const nudgeAmount = isShift ? 2 : 0.5 // mm
      let deltaX = 0
      let deltaY = 0

      switch (key) {
        case 'arrowup':
          deltaY = -nudgeAmount
          break
        case 'arrowdown':
          deltaY = nudgeAmount
          break
        case 'arrowleft':
          deltaX = -nudgeAmount
          break
        case 'arrowright':
          deltaX = nudgeAmount
          break
      }

      // Update element position
      const newX = Math.max(0, selectedElement.x + deltaX)
      const newY = Math.max(0, selectedElement.y + deltaY)
      updateSelectedElement({ x: newX, y: newY })

      // Dispatch event for workspace to sync the change to store
      window.dispatchEvent(new CustomEvent('label-studio-nudge-element', {
        detail: { id: selectedElement.id, x: newX, y: newY }
      }))
      return
    }

    // Tab — Cycle through elements
    if (key === 'tab') {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('label-studio-cycle-element', {
        detail: { reverse: isShift }
      }))
      return
    }
  }, [
    selectedElement,
    setSelectedElement,
    updateSelectedElement,
    deleteElement,
    duplicateElement,
    toggleLock,
    openHelp,
    closeHelp,
    isHelpOpen,
    closeSettings,
    isSettingsOpen,
    closeAbout,
    isAboutOpen,
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Keyboard shortcut definitions for help modal display
 */
export const KEYBOARD_SHORTCUTS = [
  { category: 'General', shortcuts: [
    { keys: ['Ctrl', 'S'], description: 'Save template' },
    { keys: ['Ctrl', 'P'], description: 'Print label' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
    { keys: ['?'], description: 'Open keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modal / Deselect element' },
  ]},
  { category: 'Element Editing', shortcuts: [
    { keys: ['Ctrl', 'D'], description: 'Duplicate selected element' },
    { keys: ['Ctrl', 'L'], description: 'Toggle element lock' },
    { keys: ['Delete'], description: 'Delete selected element' },
    { keys: ['Backspace'], description: 'Delete selected element' },
    { keys: ['Ctrl', 'A'], description: 'Select all elements' },
  ]},
  { category: 'Navigation', shortcuts: [
    { keys: ['Tab'], description: 'Select next element' },
    { keys: ['Shift', 'Tab'], description: 'Select previous element' },
  ]},
  { category: 'Positioning', shortcuts: [
    { keys: ['\u2190'], description: 'Nudge left 0.5mm' },
    { keys: ['\u2192'], description: 'Nudge right 0.5mm' },
    { keys: ['\u2191'], description: 'Nudge up 0.5mm' },
    { keys: ['\u2193'], description: 'Nudge down 0.5mm' },
    { keys: ['Shift', '\u2190'], description: 'Nudge left 2mm' },
    { keys: ['Shift', '\u2192'], description: 'Nudge right 2mm' },
    { keys: ['Shift', '\u2191'], description: 'Nudge up 2mm' },
    { keys: ['Shift', '\u2193'], description: 'Nudge down 2mm' },
  ]},
]
