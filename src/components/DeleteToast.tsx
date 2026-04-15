import { useEffect, useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'

// Global toast trigger — call from anywhere
let showToastGlobal: ((name: string) => void) | null = null

export function triggerDeleteToast(departmentName: string) {
  if (showToastGlobal) showToastGlobal(departmentName)
}

export default function DeleteToast() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [name, setName] = useState('')

  const show = useCallback((departmentName: string) => {
    setName(departmentName)
    setVisible(true)
    setFading(false)
  }, [])

  // Register the global trigger
  useEffect(() => {
    showToastGlobal = show
    return () => { showToastGlobal = null }
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
        bg-gray-900 text-white text-sm font-medium
        rounded-lg shadow-lg
        transition-opacity duration-300
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <Trash2 className="w-4 h-4 text-red-400" />
      {name} deleted
    </div>
  )
}
