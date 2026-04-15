import { useEffect } from 'react'
import {
  X,
  Rocket,
  Keyboard,
  Layers,
  QrCode,
  AlertTriangle,
  Type,
  FileText,
  Minus,
  PanelTop,
  Shapes,
  Table,
} from 'lucide-react'
import { useHelpStore } from '../../store/useHelpStore'
import { KEYBOARD_SHORTCUTS } from '../../hooks/useKeyboardShortcuts'

const TABS = [
  { id: 0, label: 'Quick Start', icon: Rocket },
  { id: 1, label: 'Shortcuts', icon: Keyboard },
  { id: 2, label: 'Elements', icon: Layers },
  { id: 3, label: 'Barcodes', icon: QrCode },
  { id: 4, label: 'Troubleshooting', icon: AlertTriangle },
]

function HelpModal() {
  const isOpen = useHelpStore((s) => s.isHelpOpen)
  const activeTab = useHelpStore((s) => s.activeTab)
  const closeHelp = useHelpStore((s) => s.closeHelp)
  const setActiveTab = useHelpStore((s) => s.setActiveTab)

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeHelp()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeHelp])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeHelp}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold text-dark">Help Center</h2>
          <button
            onClick={closeHelp}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-muted hover:text-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-muted hover:text-dark hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 0 && <QuickStartTab />}
          {activeTab === 1 && <KeyboardShortcutsTab />}
          {activeTab === 2 && <ElementsGuideTab />}
          {activeTab === 3 && <BarcodeReferenceTab />}
          {activeTab === 4 && <TroubleshootingTab />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-border text-center text-sm text-muted shrink-0">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">?</kbd> anytime to open this help
        </div>
      </div>
    </div>
  )
}

function QuickStartTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark mb-3">Welcome to Label Studio Pro</h3>
        <p className="text-body leading-relaxed">
          Label Studio Pro is a professional label design and printing application optimized for
          Zebra ZD421 thermal printers. Create labels for IT equipment, assets, warehouse items,
          and more with ease.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StepCard
          number={1}
          title="Choose a Department"
          description="Select a department tab (IT, HR, Warehouse, etc.) or create a custom department using the + button."
        />
        <StepCard
          number={2}
          title="Create a Template"
          description="Click 'New Template' and give it a name. Templates define the layout of your labels."
        />
        <StepCard
          number={3}
          title="Add Elements"
          description="Add text fields, barcodes, shapes, tables, headers, and footers to your label design."
        />
        <StepCard
          number={4}
          title="Enter Data & Print"
          description="Fill in the field values and click Print. Use Batch Print for multiple labels."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Pro Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>• Double-click any text element on the preview to quickly edit it</li>
          <li>• Use drag handles to resize and reposition elements</li>
          <li>• Templates are auto-saved to your browser's local storage</li>
          <li>• Export settings regularly as backup via Settings &gt; Export</li>
        </ul>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
          {number}
        </div>
        <div>
          <h4 className="font-medium text-dark mb-1">{title}</h4>
          <p className="text-sm text-body">{description}</p>
        </div>
      </div>
    </div>
  )
}

function KeyboardShortcutsTab() {
  return (
    <div className="space-y-6">
      <p className="text-body">
        Master these keyboard shortcuts to work faster with Label Studio Pro.
      </p>

      {KEYBOARD_SHORTCUTS.map((category) => (
        <div key={category.category}>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {category.category}
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {category.shortcuts.map((shortcut, idx) => (
                  <tr key={idx} className={idx !== 0 ? 'border-t border-gray-200' : ''}>
                    <td className="px-4 py-2.5 w-48">
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx}>
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-muted mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-body">
                      {shortcut.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function ElementsGuideTab() {
  const elements = [
    {
      icon: Type,
      name: 'Text Block',
      description: 'Dynamic text field with a label. Users enter values at print time.',
      useCase: 'Employee names, asset IDs, descriptions',
    },
    {
      icon: FileText,
      name: 'Static Text',
      description: 'Fixed text that appears the same on every label.',
      useCase: 'Company name, department labels, fixed instructions',
    },
    {
      icon: QrCode,
      name: 'Barcode',
      description: 'Dynamic barcode/QR code field. Supports Code 128, QR, Data Matrix, and more.',
      useCase: 'Asset tracking, inventory management, URL encoding',
    },
    {
      icon: Minus,
      name: 'Divider',
      description: 'Horizontal line to separate sections. Customize style and thickness.',
      useCase: 'Visual separation between label sections',
    },
    {
      icon: PanelTop,
      name: 'Header / Footer',
      description: 'Full-width colored bar at top or bottom with customizable text.',
      useCase: 'Department branding, category indicators',
    },
    {
      icon: Shapes,
      name: 'Shape',
      description: 'Decorative shapes including rectangles, circles, stars, arrows, and more.',
      useCase: 'Visual accents, icons, decorative elements',
    },
    {
      icon: Table,
      name: 'Table',
      description: 'Grid layout for structured data. Customize rows, columns, and styling.',
      useCase: 'Specifications, multi-field data, structured info',
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-body mb-4">
        Label Studio Pro supports various element types for creating professional labels.
      </p>

      {elements.map((element) => {
        const Icon = element.icon
        return (
          <div key={element.name} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-dark">{element.name}</h4>
                <p className="text-sm text-body mt-0.5">{element.description}</p>
                <p className="text-xs text-muted mt-1.5">
                  <span className="font-medium">Use for:</span> {element.useCase}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BarcodeReferenceTab() {
  const barcodes = [
    {
      type: 'Code 128',
      description: 'Most versatile 1D barcode. Supports all ASCII characters.',
      dataFormat: 'Any alphanumeric characters',
      maxLength: '80 characters',
      bestFor: 'General purpose, asset tracking',
    },
    {
      type: 'Code 39',
      description: 'Simple alphanumeric barcode. Widely supported.',
      dataFormat: 'Uppercase A-Z, 0-9, special chars (- . $ / + % space)',
      maxLength: '43 characters',
      bestFor: 'Legacy systems, simple IDs',
    },
    {
      type: 'QR Code',
      description: '2D barcode that stores more data. Scannable with smartphones.',
      dataFormat: 'Any text, URLs, or data',
      maxLength: '2,953 characters',
      bestFor: 'URLs, complex data, mobile scanning',
    },
    {
      type: 'Data Matrix',
      description: 'Compact 2D barcode. Ideal for small labels.',
      dataFormat: 'Any text or binary data',
      maxLength: '2,335 characters',
      bestFor: 'Small parts, electronics, pharmaceutical',
    },
    {
      type: 'PDF417',
      description: 'Stacked barcode that stores large amounts of data.',
      dataFormat: 'Text, binary, or numeric',
      maxLength: '1,850 characters',
      bestFor: 'IDs, licenses, transport documents',
    },
    {
      type: 'EAN-13',
      description: 'European retail barcode. 13 digits with check digit.',
      dataFormat: 'Exactly 12 digits (check digit auto-calculated)',
      maxLength: '12 digits',
      bestFor: 'Retail products (Europe)',
    },
    {
      type: 'UPC-A',
      description: 'US/Canada retail barcode. 12 digits with check digit.',
      dataFormat: 'Exactly 11 digits (check digit auto-calculated)',
      maxLength: '11 digits',
      bestFor: 'Retail products (North America)',
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-body mb-4">
        Choose the right barcode type based on your data and scanning requirements.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-semibold text-dark">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-dark">Data Format</th>
              <th className="px-3 py-2 text-left font-semibold text-dark">Max Length</th>
              <th className="px-3 py-2 text-left font-semibold text-dark">Best For</th>
            </tr>
          </thead>
          <tbody>
            {barcodes.map((barcode, idx) => (
              <tr key={barcode.type} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2.5 font-medium text-dark">{barcode.type}</td>
                <td className="px-3 py-2.5 text-body">{barcode.dataFormat}</td>
                <td className="px-3 py-2.5 text-body">{barcode.maxLength}</td>
                <td className="px-3 py-2.5 text-body">{barcode.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-amber-900 mb-2">QR Code Styling</h4>
        <p className="text-sm text-amber-800">
          QR codes support custom styling options including dot patterns (square, rounded, dots)
          and corner eye styles. Access these options in the barcode element editor when QR Code
          is selected as the barcode type.
        </p>
      </div>
    </div>
  )
}

function TroubleshootingTab() {
  const issues = [
    {
      problem: 'Barcode shows "Invalid data" error',
      solutions: [
        'Check that your data matches the barcode type requirements',
        'EAN-13 requires exactly 12 digits, UPC-A requires 11 digits',
        'Code 39 only supports uppercase letters and limited special characters',
        'Remove any leading/trailing spaces from the data',
      ],
    },
    {
      problem: 'Label doesn\'t print at correct size',
      solutions: [
        'Ensure your printer is set to 36mm × 86mm label size',
        'Check printer driver settings for correct media size',
        'Disable browser\'s "Fit to page" or scaling options in print dialog',
        'Set margins to 0 in print settings',
      ],
    },
    {
      problem: 'Elements appear blurry when printed',
      solutions: [
        'Use higher zoom level (150% or more) when designing',
        'Ensure printer DPI matches your design (203 or 300 DPI)',
        'For barcodes, use appropriate scale settings',
        'Avoid using very small font sizes (below 8pt)',
      ],
    },
    {
      problem: 'Template or settings were lost',
      solutions: [
        'Data is stored in browser localStorage and persists across sessions',
        'Clearing browser data or using private mode will reset everything',
        'Regularly export your settings via Settings > Export',
        'Use the import function to restore from a backup file',
      ],
    },
    {
      problem: 'Can\'t drag or select elements',
      solutions: [
        'Make sure the Move tool is selected in the toolbar',
        'Header and Footer elements cannot be dragged (fixed position)',
        'Click directly on the element, not the empty space around it',
        'Try zooming in for easier selection of small elements',
      ],
    },
    {
      problem: 'Batch print only prints first label',
      solutions: [
        'Ensure each line in CSV input has the correct number of fields',
        'Check for empty lines in your batch data',
        'Verify your browser allows multiple pages in print preview',
        'Try printing to PDF first to verify all pages are generated',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-body mb-4">
        Common issues and their solutions.
      </p>

      {issues.map((issue, idx) => (
        <details key={idx} className="bg-gray-50 rounded-lg overflow-hidden group">
          <summary className="px-4 py-3 cursor-pointer font-medium text-dark hover:bg-gray-100 transition-colors flex items-center justify-between">
            <span>{issue.problem}</span>
            <span className="text-muted text-lg group-open:rotate-45 transition-transform">+</span>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-gray-200">
            <ul className="text-sm text-body space-y-1.5">
              {issue.solutions.map((solution, sIdx) => (
                <li key={sIdx} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">•</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-blue-900 mb-2">Still need help?</h4>
        <p className="text-sm text-blue-800">
          Check the browser console (F12 &gt; Console) for error messages that may
          provide more details about the issue.
        </p>
      </div>
    </div>
  )
}

export default HelpModal
