import { useState, useRef, useEffect } from 'react'
import {
  X,
  Building2,
  Ruler,
  Database,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Image,
} from 'lucide-react'
import { useSettingsStore, DateFormat } from '../../store/useSettingsStore'
import { ZoomLevel, ZOOM_LEVELS } from '../../store/useLabelStore'
import { BarcodeType } from '../../types/barcode'
import { TabId } from '../../App'

// Templates tab removed - only fixed department tabs available as defaults
const TABS: { id: TabId; label: string }[] = [
  { id: 'it', label: 'IT' },
  { id: 'hr', label: 'HR' },
  { id: 'warehouse', label: 'Warehouse' },
  { id: 'security', label: 'Security' },
  { id: 'assets', label: 'Assets' },
]

const DATE_FORMATS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '04/14/2024' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '14/04/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-04-14' },
]

const BARCODE_TYPES: { value: BarcodeType; label: string }[] = [
  { value: 'code128', label: 'Code 128' },
  { value: 'code39', label: 'Code 39' },
  { value: 'qrcode', label: 'QR Code' },
  { value: 'datamatrix', label: 'Data Matrix' },
  { value: 'pdf417', label: 'PDF417' },
]

function SettingsModal() {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen)
  const closeSettings = useSettingsStore((s) => s.closeSettings)
  const company = useSettingsStore((s) => s.company)
  const labelDefaults = useSettingsStore((s) => s.labelDefaults)
  const updateCompanySettings = useSettingsStore((s) => s.updateCompanySettings)
  const updateLabelDefaults = useSettingsStore((s) => s.updateLabelDefaults)
  const setLogo = useSettingsStore((s) => s.setLogo)
  const clearAllData = useSettingsStore((s) => s.clearAllData)
  const exportSettings = useSettingsStore((s) => s.exportSettings)
  const importSettings = useSettingsStore((s) => s.importSettings)

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const importTimerRef = useRef<number | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (importTimerRef.current !== null) {
        clearTimeout(importTimerRef.current)
      }
    }
  }, [])

  if (!isSettingsOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeSettings()
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(png|svg\+xml)$/)) {
      alert('Please upload a PNG or SVG file.')
      return
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      alert('Logo file size must be under 500KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogo(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleExport = () => {
    const json = exportSettings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `label-studio-settings-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const success = importSettings(json)
      setImportStatus(success ? 'success' : 'error')
      importTimerRef.current = window.setTimeout(() => setImportStatus('idle'), 3000)
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearData = () => {
    clearAllData()
    setShowClearConfirm(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-dark">Settings</h2>
          <button
            onClick={closeSettings}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Company Settings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-dark uppercase tracking-wide">
                Company Settings
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ACME Corporation"
                  value={company.companyName}
                  onChange={(e) => updateCompanySettings({ companyName: e.target.value })}
                />
                <p className="text-xs text-muted mt-1">
                  Appears on labels that display company name
                </p>
              </div>

              <div>
                <label className="label-text">Company Logo</label>
                <div className="flex items-center gap-4">
                  {company.logoDataUrl ? (
                    <div className="relative">
                      <img
                        src={company.logoDataUrl}
                        alt="Company logo"
                        className="w-16 h-16 object-contain border border-border rounded-lg bg-gray-50 p-1"
                      />
                      <button
                        onClick={() => setLogo(null)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-gray-50">
                      <Image className="w-6 h-6 text-muted" />
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="btn-secondary text-sm flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    <p className="text-xs text-muted mt-1">PNG or SVG, max 500KB</p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Default Tab</label>
                  <select
                    className="input-field"
                    value={company.defaultTab}
                    onChange={(e) => updateCompanySettings({ defaultTab: e.target.value as TabId })}
                  >
                    {TABS.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text">Date Format</label>
                  <select
                    className="input-field"
                    value={company.dateFormat}
                    onChange={(e) => updateCompanySettings({ dateFormat: e.target.value as DateFormat })}
                  >
                    {DATE_FORMATS.map((fmt) => (
                      <option key={fmt.value} value={fmt.value}>
                        {fmt.label} ({fmt.example})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Label Defaults */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-dark uppercase tracking-wide">
                Label Defaults
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Default Width (mm)</label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    min={10}
                    max={200}
                    value={labelDefaults.defaultWidth}
                    onChange={(e) => updateLabelDefaults({ defaultWidth: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label-text">Default Height (mm)</label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    min={10}
                    max={200}
                    value={labelDefaults.defaultHeight}
                    onChange={(e) => updateLabelDefaults({ defaultHeight: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Default Barcode Type</label>
                  <select
                    className="input-field"
                    value={labelDefaults.defaultBarcodeType}
                    onChange={(e) => updateLabelDefaults({ defaultBarcodeType: e.target.value as BarcodeType })}
                  >
                    {BARCODE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Default Zoom Level</label>
                  <select
                    className="input-field"
                    value={labelDefaults.defaultZoom}
                    onChange={(e) => updateLabelDefaults({ defaultZoom: Number(e.target.value) as ZoomLevel })}
                  >
                    {ZOOM_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Data Management */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary-600" />
              <h3 className="text-sm font-semibold text-dark uppercase tracking-wide">
                Data Management
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Settings
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Settings
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImport}
                />

                {importStatus === 'success' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="w-4 h-4" />
                    Import successful
                  </span>
                )}
                {importStatus === 'error' && (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Import failed
                  </span>
                )}
              </div>

              <div className="pt-2">
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Saved Data
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          Are you sure you want to clear all data?
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          This will reset all settings, remove saved templates, and clear your logo.
                          This action cannot be undone.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleClearData}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                          >
                            Yes, Clear Everything
                          </button>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-gray-50 rounded-b-xl">
          <button onClick={closeSettings} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
