import { Settings, HelpCircle, FolderPlus, Sparkles } from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useHelpStore } from '../../store/useHelpStore'
import { useAboutStore } from '../../store/useAboutStore'

interface HeaderProps {
  onAddDepartment: () => void
}

function Header({ onAddDepartment }: HeaderProps) {
  const openSettings = useSettingsStore((s) => s.openSettings)
  const company = useSettingsStore((s) => s.company)
  const openHelp = useHelpStore((s) => s.openHelp)
  const openAbout = useAboutStore((s) => s.openAbout)

  return (
    <header className="h-header bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <img
          src={company.logoDataUrl || '/logo.svg'}
          alt={company.companyName || 'Label Studio Pro'}
          className="h-8 w-8 object-contain"
        />
        <div>
          <h1 className="text-lg font-semibold text-dark leading-tight">
            {company.companyName || 'Label Studio Pro'}
          </h1>
          <p className="text-xs text-muted leading-tight">
            Professional Label Design & Print
          </p>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAddDepartment}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-dark"
          title="Add Department"
        >
          <FolderPlus className="w-5 h-5" />
        </button>
        <button
          onClick={openSettings}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-dark"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={() => openHelp()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-dark"
          title="Help (?)"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={openAbout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-dark"
          title="About"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

export default Header
