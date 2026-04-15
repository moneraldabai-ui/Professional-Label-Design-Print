import { useEffect, useState, useCallback } from 'react'
import { Lock } from 'lucide-react'

// Global toast trigger — call from anywhere
let showLockedToastGlobal: (() => void) | null = null

export function triggerLockedToast() {
  if (showLockedToastGlobal) showLockedToastGlobal()
}

export default function LockedToast() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  const show = useCallback(() => {
    setVisible(true)
    setFading(false)
  }, [])

  // Register the global trigger
  useEffect(() => {
    showLockedToastGlobal = show
    return () => { showLockedToastGlobal = null }
  }, [show])

  // Auto-hide after 2s
  useEffect(() => {
    if (!visible) return
    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setFading(false)
    }, 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-2 px-4 py-2.5
        bg-amber-600 text-white text-sm font-medium
        rounded-lg shadow-lg
        transition-opacity duration-300
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <Lock className="w-4 h-4" />
      Element is locked — unlock to edit
    </div>
  )
}
