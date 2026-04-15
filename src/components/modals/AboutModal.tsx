import { useEffect, useMemo } from 'react'
import { X, Monitor, Globe, Calendar, Package } from 'lucide-react'
import { useAboutStore } from '../../store/useAboutStore'

// App version - sync with package.json
const APP_VERSION = '1.0.0'
const BUILD_DATE = '2026-04-15'

function AboutModal() {
  const isOpen = useAboutStore((s) => s.isAboutOpen)
  const closeAbout = useAboutStore((s) => s.closeAbout)

  // Get system information
  const systemInfo = useMemo(() => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    // Detect browser
    if (ua.includes('Electron')) {
      browser = 'Electron App'
    } else if (ua.includes('Edg/')) {
      const match = ua.match(/Edg\/([\d.]+)/)
      browser = `Microsoft Edge ${match ? match[1] : ''}`
    } else if (ua.includes('Chrome/')) {
      const match = ua.match(/Chrome\/([\d.]+)/)
      browser = `Google Chrome ${match ? match[1] : ''}`
    } else if (ua.includes('Firefox/')) {
      const match = ua.match(/Firefox\/([\d.]+)/)
      browser = `Mozilla Firefox ${match ? match[1] : ''}`
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/([\d.]+)/)
      browser = `Safari ${match ? match[1] : ''}`
    }

    // Detect OS
    if (ua.includes('Windows NT 10.0')) {
      os = 'Windows 10/11'
    } else if (ua.includes('Windows NT')) {
      os = 'Windows'
    } else if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X ([\d_]+)/)
      if (match) {
        os = `macOS ${match[1].replace(/_/g, '.')}`
      } else {
        os = 'macOS'
      }
    } else if (ua.includes('Linux')) {
      os = 'Linux'
    }

    // Screen info
    const screen = `${window.screen.width} × ${window.screen.height}`

    return { browser, os, screen }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeAbout()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeAbout])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeAbout}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-dark">About</h2>
          <button
            onClick={closeAbout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-muted hover:text-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* App Info */}
          <div className="text-center mb-6">
            <img
              src="/logo.svg"
              alt="Label Studio Pro"
              className="w-16 h-16 mx-auto mb-3"
            />
            <h3 className="text-xl font-bold text-dark">Label Studio Pro</h3>
            <p className="text-sm text-muted">Professional Label Design & Print</p>
          </div>

          {/* Version Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow
              icon={Package}
              label="Version"
              value={APP_VERSION}
            />
            <InfoRow
              icon={Calendar}
              label="Build Date"
              value={BUILD_DATE}
            />
            <div className="border-t border-gray-200 my-2" />
            <InfoRow
              icon={Globe}
              label="Browser"
              value={systemInfo.browser}
            />
            <InfoRow
              icon={Monitor}
              label="Platform"
              value={systemInfo.os}
            />
            <InfoRow
              icon={Monitor}
              label="Screen"
              value={systemInfo.screen}
            />
          </div>

          {/* License */}
          <div className="mt-6 text-center text-sm text-muted">
            <p>BUILT BY </p>
            <h3 className="font-bold text-dark">M. O. N. E. R</h3>
            <p>Application Developer& Ai Specialist</p>  
            <p>Label Studio Pro is designed and developed as a full-featured 
              label printing and QR / Barcode generation studio — built for professionals 
              who demand speed, precision, and reliability in every print.
            </p>
            <p className="mt-2">
              &copy; {new Date().getFullYear()} Label Studio Pro
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-border">
          <button
            onClick={closeAbout}
            className="w-full btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-dark">{value}</span>
    </div>
  )
}

export default AboutModal
