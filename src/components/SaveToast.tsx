import { useEffect, useState, useCallback } from 'react'
import { Check } from 'lucide-react'

// Global toast trigger — call from anywhere
let showToastGlobal: (() => void) | null = null

export function triggerSaveToast() {
  if (showToastGlobal) showToastGlobal()
}

export default function SaveToast() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  const show = useCallback(() => {
    setVisible(true)
    setFading(false)
  }, [])

  // Register the global trigger
  useEffect(() => {
    showToastGlobal = show
    return () => { showToastGlobal = null }
  }, [show])

  // Auto-hide after 1.5s
  useEffect(() => {
    if (!visible) return
    const fadeTimer = setTimeout(() => setFading(true), 1200)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setFading(false)
    }, 1500)
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
        bg-gray-900 text-white text-sm font-medium
        rounded-lg shadow-lg
        transition-opacity duration-300
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <Check className="w-4 h-4 text-green-400" />
      Saved
    </div>
  )
}
