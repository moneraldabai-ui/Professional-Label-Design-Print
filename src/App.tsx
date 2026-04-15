import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from './components/layout/Header'
import TabBar from './components/layout/TabBar'
import TwoPanel from './components/layout/TwoPanel'
import BatchPrintModal from './components/modals/BatchPrintModal'
import SettingsModal from './components/modals/SettingsModal'
import AddDepartmentModal from './components/modals/AddDepartmentModal'
import DeleteDepartmentModal from './components/modals/DeleteDepartmentModal'
import HelpModal from './components/modals/HelpModal'
import AboutModal from './components/modals/AboutModal'
import { useSettingsStore } from './store/useSettingsStore'
import { useLabelStore } from './store/useLabelStore'
import { useCustomTemplateStore } from './store/useCustomTemplateStore'
import { useFixedDepartmentStore, FixedDepartmentId } from './store/useFixedDepartmentStore'
import FixedDepartmentTab from './tabs/FixedDepartmentTab'
import CustomDepartmentTab from './tabs/CustomDepartmentTab'
import SaveToast from './components/SaveToast'
import LockedToast from './components/LockedToast'
import DeleteToast, { triggerDeleteToast } from './components/DeleteToast'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

// Built-in tab IDs (Templates tab removed)
export type BuiltInTabId = 'it' | 'hr' | 'warehouse' | 'security' | 'assets'

// TabId can be built-in or a custom department ID prefixed with 'dept-'
export type TabId = BuiltInTabId | `dept-${string}`

export interface TabDef {
  id: TabId
  label: string
  isCustomDept?: boolean
}

// Fixed department tab IDs
const FIXED_DEPARTMENT_IDS: BuiltInTabId[] = ['it', 'hr', 'warehouse', 'security', 'assets']

function App() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts()

  const company = useSettingsStore((s) => s.company)
  const labelDefaults = useSettingsStore((s) => s.labelDefaults)
  const setDimensions = useLabelStore((s) => s.setDimensions)
  const setZoom = useLabelStore((s) => s.setZoom)
  const departments = useCustomTemplateStore((s) => s.departments)
  const addDepartment = useCustomTemplateStore((s) => s.addDepartment)
  const deleteCustomDepartment = useCustomTemplateStore((s) => s.deleteDepartment)
  const renameCustomDepartment = useCustomTemplateStore((s) => s.renameDepartment)
  const fixedDepartmentNames = useFixedDepartmentStore((s) => s.departmentNames)
  const deletedFixedDepartments = useFixedDepartmentStore((s) => s.deletedDepartments)
  const deleteFixedDepartment = useFixedDepartmentStore((s) => s.deleteDepartment)
  const renameFixedDepartment = useFixedDepartmentStore((s) => s.renameDepartment)

  // Ensure default tab is valid (not 'custom' anymore)
  const validDefaultTab = (company.defaultTab as string) === 'custom' ? 'it' : company.defaultTab
  const [activeTab, setActiveTab] = useState<TabId>(validDefaultTab as TabId)
  const [initialized, setInitialized] = useState(false)
  const [showAddDeptModal, setShowAddDeptModal] = useState(false)

  // Delete department modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<{ tabId: TabId; name: string } | null>(null)

  // Generate tabs including custom departments (excluding deleted fixed departments)
  const allTabs = useMemo<TabDef[]>(() => {
    const builtInTabs: TabDef[] = FIXED_DEPARTMENT_IDS
      .filter((id) => !deletedFixedDepartments.includes(id))
      .map((id) => ({
        id,
        label: fixedDepartmentNames[id],
      }))
    const customDeptTabs: TabDef[] = departments.map((dept) => ({
      id: `dept-${dept.id}` as TabId,
      label: dept.name,
      isCustomDept: true,
    }))
    return [...builtInTabs, ...customDeptTabs]
  }, [departments, fixedDepartmentNames, deletedFixedDepartments])

  // Check if we can delete tabs (need at least 2)
  const canDeleteTab = allTabs.length > 1

  // Get all department names for duplicate checking
  const allDepartmentNames = useMemo(() => {
    const fixedNames = Object.values(fixedDepartmentNames)
    const customNames = departments.map((d) => d.name)
    return [...fixedNames, ...customNames]
  }, [fixedDepartmentNames, departments])

  // Handle tab rename
  const handleRenameTab = (tabId: TabId, newName: string): string | null => {
    // Validation
    const trimmedName = newName.trim()
    if (trimmedName.length < 1) {
      return 'Name must be at least 1 character'
    }
    if (trimmedName.length > 30) {
      return 'Name must be 30 characters or less'
    }

    // Check for duplicates (case-insensitive)
    const currentTab = allTabs.find((t) => t.id === tabId)
    const isDuplicate = allDepartmentNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase() && name !== currentTab?.label
    )
    if (isDuplicate) {
      return 'A department with this name already exists'
    }

    // Apply rename
    if (tabId.startsWith('dept-')) {
      const deptId = tabId.replace('dept-', '')
      renameCustomDepartment(deptId, trimmedName)
    } else {
      renameFixedDepartment(tabId as FixedDepartmentId, trimmedName)
    }

    return null // Success
  }

  // Handle opening delete modal from TabBar or left panel
  const handleOpenDeleteModal = useCallback((tabId: TabId, tabLabel: string) => {
    setDepartmentToDelete({ tabId, name: tabLabel })
    setDeleteModalOpen(true)
  }, [])

  // Handle confirming department deletion
  const handleConfirmDelete = useCallback(() => {
    if (!departmentToDelete) return

    const { tabId, name } = departmentToDelete

    // Delete the department
    if (tabId.startsWith('dept-')) {
      const deptId = tabId.replace('dept-', '')
      deleteCustomDepartment(deptId)
    } else {
      deleteFixedDepartment(tabId as FixedDepartmentId)
    }

    // Switch to first available tab if we're deleting the active tab
    if (activeTab === tabId) {
      const remainingTabs = allTabs.filter((t) => t.id !== tabId)
      if (remainingTabs.length > 0) {
        setActiveTab(remainingTabs[0].id)
      }
    }

    // Close modal and show toast
    setDeleteModalOpen(false)
    setDepartmentToDelete(null)
    triggerDeleteToast(name)
  }, [departmentToDelete, activeTab, allTabs, deleteCustomDepartment, deleteFixedDepartment])

  // Handle closing delete modal
  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false)
    setDepartmentToDelete(null)
  }, [])

  // Apply default settings on first load
  useEffect(() => {
    if (!initialized) {
      // Use 'it' as fallback if default tab was 'custom'
      const safeDefaultTab = (company.defaultTab as string) === 'custom' ? 'it' : company.defaultTab
      setActiveTab(safeDefaultTab as TabId)
      setDimensions({ width: labelDefaults.defaultWidth, height: labelDefaults.defaultHeight })
      setZoom(labelDefaults.defaultZoom)
      setInitialized(true)
    }
  }, [company.defaultTab, labelDefaults, setDimensions, setZoom, initialized])

  // Reset to first available tab if active department was deleted
  useEffect(() => {
    const tabExists = allTabs.some((t) => t.id === activeTab)
    if (!tabExists && allTabs.length > 0) {
      setActiveTab(allTabs[0].id)
    }
  }, [allTabs, activeTab])

  // Handle adding a new department
  const handleAddDepartment = (name: string) => {
    const deptId = addDepartment(name)
    setShowAddDeptModal(false)
    // Switch to the new department tab
    setActiveTab(`dept-${deptId}` as TabId)
  }

  const renderTabContent = () => {
    // Get current tab info for delete handler
    const currentTab = allTabs.find((t) => t.id === activeTab)
    const currentTabName = currentTab?.label || ''

    // Handle custom department tabs
    if (activeTab.startsWith('dept-')) {
      const deptId = activeTab.replace('dept-', '')
      return (
        <CustomDepartmentTab
          departmentId={deptId}
          onDeleteDepartment={() => handleOpenDeleteModal(activeTab, currentTabName)}
          canDelete={canDeleteTab}
        />
      )
    }

    // Handle built-in tabs
    const departmentId = FIXED_DEPARTMENT_IDS.includes(activeTab as BuiltInTabId) ? activeTab : 'it'
    const departmentName = fixedDepartmentNames[departmentId as FixedDepartmentId]
    return (
      <FixedDepartmentTab
        departmentId={departmentId as BuiltInTabId}
        departmentName={departmentName}
        onDeleteDepartment={() => handleOpenDeleteModal(activeTab, departmentName)}
        canDelete={canDeleteTab}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-panel overflow-hidden">
      <Header onAddDepartment={() => setShowAddDeptModal(true)} />
      <TabBar
        tabs={allTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRenameTab={handleRenameTab}
        onDeleteTab={handleOpenDeleteModal}
        canDeleteTab={canDeleteTab}
      />
      <TwoPanel>
        {renderTabContent()}
      </TwoPanel>
      <BatchPrintModal />
      <SettingsModal />
      <AddDepartmentModal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        onSubmit={handleAddDepartment}
      />
      <DeleteDepartmentModal
        isOpen={deleteModalOpen}
        departmentName={departmentToDelete?.name || ''}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
      <HelpModal />
      <AboutModal />
      <SaveToast />
      <LockedToast />
      <DeleteToast />
    </div>
  )
}

export default App
