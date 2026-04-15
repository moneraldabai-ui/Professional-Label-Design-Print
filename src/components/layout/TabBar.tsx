import { useState, useRef, useEffect } from 'react'
import {
  Monitor,
  Users,
  Warehouse,
  Shield,
  Package,
  Folder,
  X
} from 'lucide-react'
import type { TabId, TabDef, BuiltInTabId } from '../../App'

interface TabBarProps {
  tabs: TabDef[]
  activeTab: TabId
  onTabChange: (tabId: TabId) => void
  onRenameTab?: (tabId: TabId, newName: string) => string | null // Returns error message or null on success
  onDeleteTab?: (tabId: TabId, tabLabel: string) => void
  canDeleteTab: boolean // True if there's more than one tab
}

// Icons for built-in fixed department tabs (Templates tab removed)
const builtInIcons: Record<BuiltInTabId, React.ReactNode> = {
  it: <Monitor className="w-4 h-4" />,
  hr: <Users className="w-4 h-4" />,
  warehouse: <Warehouse className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  assets: <Package className="w-4 h-4" />,
}

function TabBar({ tabs, activeTab, onTabChange, onRenameTab, onDeleteTab, canDeleteTab }: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<TabId | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTabId])

  const startEditing = (tab: TabDef) => {
    if (!onRenameTab) return
    setEditingTabId(tab.id)
    setEditValue(tab.label)
    setEditError(null)
  }

  const cancelEditing = () => {
    setEditingTabId(null)
    setEditValue('')
    setEditError(null)
  }

  const confirmEditing = () => {
    if (!editingTabId || !onRenameTab) return

    const originalTab = tabs.find((t) => t.id === editingTabId)
    const trimmedValue = editValue.trim()

    // If empty, revert to original
    if (!trimmedValue) {
      cancelEditing()
      return
    }

    // If unchanged, just close
    if (trimmedValue === originalTab?.label) {
      cancelEditing()
      return
    }

    const error = onRenameTab(editingTabId, trimmedValue)
    if (error) {
      setEditError(error)
      inputRef.current?.focus()
    } else {
      cancelEditing()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent, tab: TabDef) => {
    e.preventDefault()
    e.stopPropagation()
    startEditing(tab)
  }
  const getIcon = (tab: TabDef) => {
    if (tab.isCustomDept) {
      return <Folder className="w-4 h-4" />
    }
    return builtInIcons[tab.id as BuiltInTabId]
  }

  return (
    <nav className="h-tabbar bg-white border-b border-border flex items-center px-4 gap-1 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const isEditing = editingTabId === tab.id

        if (isEditing) {
          return (
            <div key={tab.id} className="relative shrink-0">
              <div className="flex items-center gap-2 px-2 py-1">
                {getIcon(tab)}
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value)
                    setEditError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={confirmEditing}
                  maxLength={30}
                  className={`
                    w-32 px-2 py-1 text-sm font-medium rounded border
                    focus:outline-none focus:ring-2
                    ${editError
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-primary-500 focus:ring-primary-200'
                    }
                  `}
                />
              </div>
              {editError && (
                <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded shadow-lg whitespace-nowrap z-50">
                  {editError}
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={tab.id}
            className="relative group shrink-0"
          >
            <button
              onClick={() => onTabChange(tab.id)}
              onDoubleClick={(e) => handleDoubleClick(e, tab)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-150 pr-8
                ${isActive
                  ? tab.isCustomDept
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-primary-600 text-white shadow-sm'
                  : 'text-body hover:bg-gray-100 hover:text-dark'
                }
              `}
              title="Double-click to rename"
            >
              {getIcon(tab)}
              {tab.label}
            </button>
            {/* Delete button - shows on hover */}
            {canDeleteTab && onDeleteTab && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteTab(tab.id, tab.label)
                }}
                className={`
                  absolute right-1 top-1/2 -translate-y-1/2
                  p-1 rounded-full opacity-0 group-hover:opacity-100
                  transition-opacity duration-150
                  ${isActive
                    ? 'hover:bg-white/20 text-white/80 hover:text-white'
                    : 'hover:bg-gray-200 text-muted hover:text-dark'
                  }
                `}
                title={canDeleteTab ? 'Delete department' : 'Cannot delete the last department'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!canDeleteTab && (
              <div
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-50 cursor-not-allowed"
                title="Cannot delete the last department"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default TabBar
