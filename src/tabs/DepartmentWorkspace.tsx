import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus,
  Save,
  Trash2,
  Type,
  QrCode,
  Printer,
  ChevronDown,
  ChevronRight,
  FileText,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
  Download,
  Layers,
  RotateCcw,
  Palette,
  PanelTop,
  PanelBottom,
  Shapes,
  Square,
  Circle,
  Triangle,
  Star,
  MoveHorizontal,
  MoveVertical,
  ArrowRight,
  ArrowUpIcon,
  Heart,
  Diamond,
  Table,
  Lock,
} from 'lucide-react'
import DimensionEditor from '../components/controls/DimensionEditor'
import { useLabelStore } from '../store/useLabelStore'
import { usePreviewStore } from '../store/usePreviewStore'
import { useBatchPrintStore } from '../store/useBatchPrintStore'
import {
  useCustomTemplateStore,
  createTextBlockElement,
  createBarcodeElement,
  createStaticTextElement,
  createDividerElement,
  createHeaderElement,
  createFooterElement,
  createShapeElement,
  createTableElement,
  TemplateElement,
  TextBlockElement,
  BarcodeTemplateElement,
  StaticTextElement,
  DividerElement,
  HeaderElement,
  FooterElement,
  ShapeElement,
  ShapeType,
  TableElement,
  TableCell,
  Template,
  QrDotsStyle,
  QrCornersStyle,
  QrCornersShape,
} from '../store/useCustomTemplateStore'
import { useFixedDepartmentStore, FixedDepartmentId } from '../store/useFixedDepartmentStore'
import { useToolbarStore } from '../store/useToolbarStore'
import { useHistoryStore } from '../store/useHistoryStore'
import { prebuiltTemplates, PrebuiltTemplate } from '../data/prebuiltTemplates'
import { printCurrentLabel } from '../utils/print'
import { exportCurrentLabel } from '../utils/export'
import { triggerSaveToast } from '../components/SaveToast'
import { BarcodeType } from '../types/barcode'

// Props for the unified workspace
export interface DepartmentWorkspaceProps {
  storeType: 'fixed' | 'custom'
  departmentId: string
  departmentName?: string // Required for fixed, optional for custom (derived from store)
  onDeleteDepartment?: () => void // Callback to trigger delete modal
  canDelete?: boolean // Whether the department can be deleted (false if last remaining)
}

// Stable empty arrays for selector fallback
const EMPTY_ELEMENTS: TemplateElement[] = []
const EMPTY_PREVIEW: Record<string, string> = {}

// Store adapter interface to unify both store APIs
interface StoreAdapter {
  templates: Template[]
  selectedTemplateId: string | null
  elements: TemplateElement[]
  fieldValues: Record<string, string>
  departmentName: string
  departmentExists: boolean
  // Label appearance
  backgroundColor: string
  backgroundOpacity: number
  // Actions
  selectTemplate: (templateId: string) => void
  addTemplate: (name: string) => string
  renameTemplate: (templateId: string, name: string) => void
  deleteTemplate: (templateId: string) => void
  importPrebuiltTemplate: (data: { name: string; elements: TemplateElement[] }) => void
  addElement: (element: TemplateElement) => void
  updateElement: (elementId: string, updates: Partial<TemplateElement>) => void
  deleteElement: (elementId: string) => void
  moveElementUp: (elementId: string) => void
  moveElementDown: (elementId: string) => void
  setElements: (elements: TemplateElement[]) => void
  setPreviewValue: (elementId: string, value: string) => void
  updateTemplateSettings: (updates: { backgroundColor?: string; backgroundOpacity?: number }) => void
}

// Hook to create unified store adapter
function useStoreAdapter(
  storeType: 'fixed' | 'custom',
  departmentId: string,
  departmentNameProp?: string
): StoreAdapter {
  // Custom department store selectors
  const customDepartments = useCustomTemplateStore((s) => s.departments)
  const customSelectedTemplateId = useCustomTemplateStore((s) => s.selectedTemplateId)
  const customSelectedDepartmentId = useCustomTemplateStore((s) => s.selectedDepartmentId)
  const customPreviewValues = useCustomTemplateStore((s) => s.previewValues)

  // Fixed department store selectors
  const fixedDeptData = useFixedDepartmentStore((s) => s.departments[departmentId as FixedDepartmentId])
  const fixedPreviewValues = useFixedDepartmentStore((s) => s.previewValues)

  // Get store actions via refs
  const customActions = useRef(useCustomTemplateStore.getState())
  customActions.current = useCustomTemplateStore.getState()

  const fixedActions = useRef(useFixedDepartmentStore.getState())
  fixedActions.current = useFixedDepartmentStore.getState()

  // Build the adapter based on store type
  return useMemo<StoreAdapter>(() => {
    if (storeType === 'custom') {
      const department = customDepartments.find((d) => d.id === departmentId)
      const selectedTplId = customSelectedDepartmentId === departmentId ? customSelectedTemplateId : null
      const selectedTemplate = selectedTplId
        ? department?.templates.find((t) => t.id === selectedTplId)
        : null
      const elements = selectedTemplate?.elements ?? EMPTY_ELEMENTS

      return {
        templates: department?.templates ?? [],
        selectedTemplateId: selectedTplId,
        elements,
        fieldValues: selectedTplId ? customPreviewValues[selectedTplId] || EMPTY_PREVIEW : EMPTY_PREVIEW,
        departmentName: department?.name ?? departmentNameProp ?? 'Department',
        departmentExists: !!department,
        backgroundColor: selectedTemplate?.backgroundColor ?? '#ffffff',
        backgroundOpacity: selectedTemplate?.backgroundOpacity ?? 100,
        selectTemplate: (templateId) => customActions.current.selectTemplate(departmentId, templateId),
        addTemplate: (name) => customActions.current.addTemplate(departmentId, name),
        renameTemplate: (templateId, name) => customActions.current.renameTemplate(departmentId, templateId, name),
        deleteTemplate: (templateId) => customActions.current.deleteTemplate(departmentId, templateId),
        importPrebuiltTemplate: (data) => customActions.current.importPrebuiltTemplate(departmentId, data),
        addElement: (element) => customActions.current.addElement(element),
        updateElement: (elementId, updates) => customActions.current.updateElement(elementId, updates),
        deleteElement: (elementId) => customActions.current.deleteElement(elementId),
        moveElementUp: (elementId) => customActions.current.moveElementUp(elementId),
        moveElementDown: (elementId) => customActions.current.moveElementDown(elementId),
        setElements: (elements) => customActions.current.setElements(elements),
        setPreviewValue: (elementId, value) => {
          if (selectedTplId) customActions.current.setPreviewValue(selectedTplId, elementId, value)
        },
        updateTemplateSettings: (updates) => customActions.current.updateTemplateSettings(updates),
      }
    } else {
      // Fixed department store
      const selectedTplId = fixedDeptData?.selectedTemplateId ?? null
      const selectedTemplate = selectedTplId
        ? fixedDeptData?.templates.find((t) => t.id === selectedTplId)
        : null
      const elements = selectedTemplate?.elements ?? EMPTY_ELEMENTS
      const fixedDeptId = departmentId as FixedDepartmentId

      return {
        templates: fixedDeptData?.templates ?? [],
        selectedTemplateId: selectedTplId,
        elements,
        fieldValues: selectedTplId ? fixedPreviewValues[selectedTplId] || EMPTY_PREVIEW : EMPTY_PREVIEW,
        departmentName: departmentNameProp ?? departmentId,
        departmentExists: !!fixedDeptData,
        backgroundColor: selectedTemplate?.backgroundColor ?? '#ffffff',
        backgroundOpacity: selectedTemplate?.backgroundOpacity ?? 100,
        selectTemplate: (templateId) => fixedActions.current.selectTemplate(fixedDeptId, templateId),
        addTemplate: (name) => fixedActions.current.addTemplate(fixedDeptId, name),
        renameTemplate: (templateId, name) => fixedActions.current.renameTemplate(fixedDeptId, templateId, name),
        deleteTemplate: (templateId) => fixedActions.current.deleteTemplate(fixedDeptId, templateId),
        importPrebuiltTemplate: (data) => fixedActions.current.importPrebuiltTemplate(fixedDeptId, data),
        addElement: (element) => {
          if (selectedTplId) fixedActions.current.addElement(fixedDeptId, selectedTplId, element)
        },
        updateElement: (elementId, updates) => {
          if (selectedTplId) fixedActions.current.updateElement(fixedDeptId, selectedTplId, elementId, updates)
        },
        deleteElement: (elementId) => {
          if (selectedTplId) fixedActions.current.deleteElement(fixedDeptId, selectedTplId, elementId)
        },
        moveElementUp: (elementId) => {
          if (selectedTplId) fixedActions.current.moveElementUp(fixedDeptId, selectedTplId, elementId)
        },
        moveElementDown: (elementId) => {
          if (selectedTplId) fixedActions.current.moveElementDown(fixedDeptId, selectedTplId, elementId)
        },
        setElements: (elements) => {
          if (selectedTplId) fixedActions.current.setElements(fixedDeptId, selectedTplId, elements)
        },
        setPreviewValue: (elementId, value) => {
          if (selectedTplId) fixedActions.current.setPreviewValue(selectedTplId, elementId, value)
        },
        updateTemplateSettings: (updates) => {
          if (selectedTplId) fixedActions.current.updateTemplateSettings(fixedDeptId, selectedTplId, updates)
        },
      }
    }
  }, [
    storeType,
    departmentId,
    departmentNameProp,
    customDepartments,
    customSelectedTemplateId,
    customSelectedDepartmentId,
    customPreviewValues,
    fixedDeptData,
    fixedPreviewValues,
  ])
}

function DepartmentWorkspace({ storeType, departmentId, departmentName: departmentNameProp, onDeleteDepartment, canDelete = true }: DepartmentWorkspaceProps) {
  const zoom = useLabelStore((s) => s.zoom)
  const setPreviewProps = usePreviewStore((s) => s.setPreviewProps)
  const setElementUpdateCallback = usePreviewStore((s) => s.setElementUpdateCallback)
  const setElementDoubleClickCallback = usePreviewStore((s) => s.setElementDoubleClickCallback)
  const openModal = useBatchPrintStore((s) => s.openModal)

  // Get unified store adapter
  const store = useStoreAdapter(storeType, departmentId, departmentNameProp)

  // UI state
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showNewTemplateInput, setShowNewTemplateInput] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showPrebuiltLibrary, setShowPrebuiltLibrary] = useState(false)
  const [showShapePicker, setShowShapePicker] = useState(false)
  const shapePickerRef = useRef<HTMLDivElement>(null)

  // Focused element state for double-click-to-edit feature
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null)

  // Toolbar integration
  const setOnElementChange = useToolbarStore((s) => s.setOnElementChange)
  const setOnDeleteElement = useToolbarStore((s) => s.setOnDeleteElement)
  const setOnDuplicateElement = useToolbarStore((s) => s.setOnDuplicateElement)
  const setOnToggleLock = useToolbarStore((s) => s.setOnToggleLock)

  // History store
  const historyPushState = useHistoryStore((s) => s.pushState)
  const historyUndo = useHistoryStore((s) => s.undo)
  const historyRedo = useHistoryStore((s) => s.redo)
  const historyClear = useHistoryStore((s) => s.clear)

  // Ref to current elements for callbacks
  const elementsRef = useRef(store.elements)
  elementsRef.current = store.elements

  // Ref to store for callbacks
  const storeRef = useRef(store)
  storeRef.current = store

  // Get selected template
  const selectedTpl = store.templates.find((t) => t.id === store.selectedTemplateId) || null

  // For custom departments: auto-select department on mount
  useEffect(() => {
    if (storeType === 'custom') {
      const customStore = useCustomTemplateStore.getState()
      if (customStore.selectedDepartmentId !== departmentId) {
        customStore.selectDepartment(departmentId)
      }
      // Auto-select first template if none selected
      const dept = customStore.departments.find((d) => d.id === departmentId)
      if (dept && dept.templates.length > 0 && !customStore.selectedTemplateId) {
        customStore.selectTemplate(departmentId, dept.templates[0].id)
      }
    }
  }, [storeType, departmentId])

  // Handle element updates from preview (drag-to-move, resize)
  // Use ref to access current values in callbacks without re-creating them
  const handleElementUpdateRef = useRef<(id: string, updates: Partial<TemplateElement>) => void>(() => {})
  handleElementUpdateRef.current = (id: string, updates: Partial<TemplateElement>) => {
    historyPushState(elementsRef.current)
    storeRef.current.updateElement(id, updates)
    triggerSaveToast()
  }

  // Wire up toolbar callbacks
  useEffect(() => {
    setOnElementChange((element) => {
      if (element) {
        storeRef.current.updateElement(element.id, {
          posX: Math.round(element.x * 100) / 100,
          posY: Math.round(element.y * 100) / 100,
          freeRotation: element.rotation,
          absScale: element.scale,
          flipH: element.flipH,
          flipV: element.flipV,
          zIndex: element.zIndex,
        })
      }
    })

    setOnDeleteElement(() => {
      const sel = useToolbarStore.getState().selectedElement
      if (sel) {
        historyPushState(elementsRef.current)
        storeRef.current.deleteElement(sel.id)
        triggerSaveToast()
      }
    })

    setOnDuplicateElement(() => {
      const sel = useToolbarStore.getState().selectedElement
      if (sel) {
        historyPushState(elementsRef.current)
        const current = elementsRef.current
        const original = current.find((el) => el.id === sel.id)
        if (original) {
          const duplicate = {
            ...JSON.parse(JSON.stringify(original)),
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            posX: (original.posX ?? 1) + 2,
            posY: (original.posY ?? 1) + 2,
          }
          storeRef.current.addElement(duplicate)
          triggerSaveToast()
        }
      }
    })

    setOnToggleLock(() => {
      const sel = useToolbarStore.getState().selectedElement
      if (sel) {
        const element = elementsRef.current.find((el) => el.id === sel.id)
        if (element) {
          storeRef.current.updateElement(sel.id, { locked: !element.locked })
          // Update the selected element state to reflect the change
          useToolbarStore.getState().updateSelectedElement({ locked: !element.locked })
          triggerSaveToast()
        }
      }
    })

    return () => {
      setOnElementChange(null)
      setOnDeleteElement(null)
      setOnDuplicateElement(null)
      setOnToggleLock(null)
    }
  }, [setOnElementChange, setOnDeleteElement, setOnDuplicateElement, setOnToggleLock, historyPushState])

  // Listen for toolbar actions that need history
  useEffect(() => {
    const handlePushHistory = () => {
      historyPushState(elementsRef.current)
      triggerSaveToast()
    }
    window.addEventListener('label-studio-push-history', handlePushHistory)
    return () => window.removeEventListener('label-studio-push-history', handlePushHistory)
  }, [historyPushState])

  // Listen for Rotate 90° toolbar action
  useEffect(() => {
    const handleRotate90 = () => {
      const sel = useToolbarStore.getState().selectedElement
      if (!sel) return

      // Find the element in the current elements array
      const element = elementsRef.current.find((el) => el.id === sel.id)
      if (!element) return

      // Calculate new rotation: cycle through 0 → 90 → 180 → 270 → 0
      const currentRotation = element.rotation ?? 0
      const newRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270

      // Push history and update
      historyPushState(elementsRef.current)
      storeRef.current.updateElement(sel.id, { rotation: newRotation })
      triggerSaveToast()

      // Update the toolbar's selected element rotation too for visual consistency
      useToolbarStore.getState().setSelectedElement({
        ...sel,
        rotation: newRotation,
      })
    }

    window.addEventListener('label-studio-rotate-90', handleRotate90)
    return () => window.removeEventListener('label-studio-rotate-90', handleRotate90)
  }, [historyPushState])

  // Listen for undo/redo events
  useEffect(() => {
    const handleUndoEvent = () => {
      const restored = historyUndo(elementsRef.current)
      if (restored) {
        storeRef.current.setElements(restored)
      }
    }

    const handleRedoEvent = () => {
      const restored = historyRedo(elementsRef.current)
      if (restored) {
        storeRef.current.setElements(restored)
      }
    }

    window.addEventListener('label-studio-undo', handleUndoEvent)
    window.addEventListener('label-studio-redo', handleRedoEvent)
    return () => {
      window.removeEventListener('label-studio-undo', handleUndoEvent)
      window.removeEventListener('label-studio-redo', handleRedoEvent)
    }
  }, [historyUndo, historyRedo])

  // Clear history when template changes
  useEffect(() => {
    historyClear()
  }, [store.selectedTemplateId, historyClear])

  // Listen for keyboard shortcut events
  useEffect(() => {
    // Save shortcut
    const handleSaveEvent = () => {
      triggerSaveToast()
    }

    // Nudge element shortcut
    const handleNudgeEvent = (e: CustomEvent<{ id: string; x: number; y: number }>) => {
      const { id, x, y } = e.detail
      historyPushState(elementsRef.current)
      storeRef.current.updateElement(id, {
        posX: Math.round(x * 100) / 100,
        posY: Math.round(y * 100) / 100,
      })
    }

    // Cycle through elements shortcut
    const handleCycleEvent = (e: CustomEvent<{ reverse: boolean }>) => {
      const elements = elementsRef.current
      if (elements.length === 0) return

      const currentSelected = useToolbarStore.getState().selectedElement
      const currentIndex = currentSelected
        ? elements.findIndex((el) => el.id === currentSelected.id)
        : -1

      let nextIndex: number
      if (e.detail.reverse) {
        nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1
      } else {
        nextIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1
      }

      const nextElement = elements[nextIndex]
      if (nextElement) {
        // Select the element
        useToolbarStore.getState().setSelectedElement({
          id: nextElement.id,
          rotation: nextElement.freeRotation ?? nextElement.rotation ?? 0,
          scale: nextElement.absScale ?? 1,
          x: nextElement.posX ?? 0,
          y: nextElement.posY ?? 0,
          width: nextElement.width ?? 10,
          height: nextElement.height ?? 10,
          flipH: nextElement.flipH ?? false,
          flipV: nextElement.flipV ?? false,
          zIndex: nextElement.zIndex ?? 0,
          locked: nextElement.locked ?? false,
        })
      }
    }

    // Select all elements shortcut (select first element for now, since multi-select is not implemented)
    const handleSelectAllEvent = () => {
      const elements = elementsRef.current
      if (elements.length > 0) {
        const firstElement = elements[0]
        useToolbarStore.getState().setSelectedElement({
          id: firstElement.id,
          rotation: firstElement.freeRotation ?? firstElement.rotation ?? 0,
          scale: firstElement.absScale ?? 1,
          x: firstElement.posX ?? 0,
          y: firstElement.posY ?? 0,
          width: firstElement.width ?? 10,
          height: firstElement.height ?? 10,
          flipH: firstElement.flipH ?? false,
          flipV: firstElement.flipV ?? false,
          zIndex: firstElement.zIndex ?? 0,
          locked: firstElement.locked ?? false,
        })
      }
    }

    window.addEventListener('label-studio-save', handleSaveEvent)
    window.addEventListener('label-studio-nudge-element', handleNudgeEvent as EventListener)
    window.addEventListener('label-studio-cycle-element', handleCycleEvent as EventListener)
    window.addEventListener('label-studio-select-all', handleSelectAllEvent)

    return () => {
      window.removeEventListener('label-studio-save', handleSaveEvent)
      window.removeEventListener('label-studio-nudge-element', handleNudgeEvent as EventListener)
      window.removeEventListener('label-studio-cycle-element', handleCycleEvent as EventListener)
      window.removeEventListener('label-studio-select-all', handleSelectAllEvent)
    }
  }, [historyPushState])

  // Register the element update callback once on mount
  useEffect(() => {
    setElementUpdateCallback((id, updates) => {
      handleElementUpdateRef.current(id, updates)
    })
    return () => setElementUpdateCallback(null)
  }, [setElementUpdateCallback])

  // Register the double-click callback for inline editing
  useEffect(() => {
    setElementDoubleClickCallback((elementId: string) => {
      setFocusedElementId(elementId)
    })
    return () => setElementDoubleClickCallback(null)
  }, [setElementDoubleClickCallback])

  // Update preview props when elements or field values change (store data only, no JSX)
  useEffect(() => {
    if (store.elements.length > 0) {
      setPreviewProps({
        elements: store.elements,
        fieldValues: store.fieldValues,
        zoom: zoom,
        backgroundColor: store.backgroundColor,
        backgroundOpacity: store.backgroundOpacity,
      })
    } else {
      setPreviewProps(null)
    }
  }, [store.elements, store.fieldValues, zoom, store.backgroundColor, store.backgroundOpacity, setPreviewProps])

  // Clear preview on unmount
  useEffect(() => {
    return () => setPreviewProps(null)
  }, [setPreviewProps])

  // Close shape picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showShapePicker && shapePickerRef.current && !shapePickerRef.current.contains(e.target as Node)) {
        setShowShapePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showShapePicker])

  if (!store.departmentExists) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        <p>Department not found</p>
      </div>
    )
  }

  // Template management
  const handleAddTemplate = () => {
    if (newTemplateName.trim()) {
      const templateId = store.addTemplate(newTemplateName.trim())
      store.selectTemplate(templateId)
      setNewTemplateName('')
      setShowNewTemplateInput(false)
    }
  }

  const startEditTemplate = (tplId: string, currentName: string) => {
    setEditingTemplateKey(tplId)
    setEditName(currentName)
  }

  const saveEditTemplate = (tplId: string) => {
    if (editName.trim()) {
      store.renameTemplate(tplId, editName.trim())
    }
    setEditingTemplateKey(null)
    setEditName('')
  }

  const handleSelectTemplate = (tplId: string) => {
    store.selectTemplate(tplId)
  }

  const handleDeleteTemplate = (tplId: string) => {
    store.deleteTemplate(tplId)
  }

  // Import prebuilt template
  const handleImportPrebuilt = (template: PrebuiltTemplate) => {
    store.importPrebuiltTemplate({
      name: template.name,
      elements: template.elements.map((el) => ({
        ...el,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    })
    setShowPrebuiltLibrary(false)
  }

  // Update preview value
  const updateFieldValue = (elementId: string, value: string) => {
    store.setPreviewValue(elementId, value)
  }

  // Add element
  const handleAddElement = (element: TemplateElement) => {
    store.addElement(element)
    triggerSaveToast()
  }

  // Update element
  const handleUpdateElement = (elementId: string, updates: Partial<TemplateElement>) => {
    storeRef.current.updateElement(elementId, updates)
    triggerSaveToast()
  }

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    store.deleteElement(elementId)
    triggerSaveToast()
  }

  // Move element
  const handleMoveElementUp = (elementId: string) => {
    store.moveElementUp(elementId)
    triggerSaveToast()
  }

  const handleMoveElementDown = (elementId: string) => {
    store.moveElementDown(elementId)
    triggerSaveToast()
  }

  // Print
  const handlePrint = () => {
    printCurrentLabel()
  }

  // Export
  const handleExport = () => {
    const templateName = selectedTpl?.name || 'Custom'
    exportCurrentLabel(templateName, store.departmentName)
  }

  // Batch print
  const handleBatchPrint = () => {
    if (!selectedTpl) return

    const textFields = store.elements
      .filter((el): el is TextBlockElement => el.type === 'text-block')
      .map((el) => el.label)

    const barcodeFields = store.elements
      .filter((el): el is BarcodeTemplateElement => el.type === 'barcode')
      .map((el) => el.label)

    const allFields = [...textFields, ...barcodeFields]

    if (allFields.length === 0) {
      alert('Add some text or barcode elements to use batch print')
      return
    }

    openModal({
      tabName: store.departmentName,
      templateName: selectedTpl.name,
      fieldNames: allFields,
      placeholder: allFields.map((f) => `value for ${f}`).join(','),
    })
  }

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h1 className="text-lg font-semibold text-dark">
          {store.departmentName}
        </h1>
        {onDeleteDepartment && (
          <button
            onClick={onDeleteDepartment}
            disabled={!canDelete}
            className={`p-2 rounded-lg transition-colors ${
              canDelete
                ? 'text-muted hover:text-red-600 hover:bg-red-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={canDelete ? 'Delete department' : 'Cannot delete the last department'}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Templates List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-dark uppercase tracking-wide">
            Templates
          </h2>
          <button
            onClick={() => setShowNewTemplateInput(true)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Add Template"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New template input */}
        {showNewTemplateInput && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="input-field flex-1 text-sm"
              placeholder="Template name..."
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
              autoFocus
            />
            <button onClick={handleAddTemplate} className="p-2 text-success hover:bg-green-50 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowNewTemplateInput(false); setNewTemplateName('') }} className="p-2 text-muted hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Templates list */}
        <div className="space-y-1">
          {store.templates.length === 0 ? (
            <div className="text-center py-6 text-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs mt-1">Create one or import from library</p>
            </div>
          ) : (
            store.templates.map((tpl) => (
              <div
                key={tpl.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  store.selectedTemplateId === tpl.id
                    ? 'bg-primary-100 border border-primary-300'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => handleSelectTemplate(tpl.id)}
              >
                <FileText className="w-4 h-4 text-muted shrink-0" />

                {editingTemplateKey === tpl.id ? (
                  <input
                    type="text"
                    className="flex-1 px-2 py-0.5 text-sm border border-primary-300 rounded"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditTemplate(tpl.id)}
                    onBlur={() => saveEditTemplate(tpl.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm text-body truncate">{tpl.name}</span>
                )}

                <span className="text-xs text-muted">{tpl.elements.length}</span>

                <button
                  onClick={(e) => { e.stopPropagation(); startEditTemplate(tpl.id, tpl.name) }}
                  className="p-1 text-muted hover:text-primary-600"
                  title="Rename"
                >
                  <Edit3 className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id) }}
                  className="p-1 text-muted hover:text-error"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <hr className="border-border" />

      {/* Prebuilt Template Library */}
      <section>
        <button
          onClick={() => setShowPrebuiltLibrary(!showPrebuiltLibrary)}
          className="flex items-center gap-2 w-full p-3 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
        >
          <BookOpen className="w-5 h-5 text-primary-600" />
          <span className="flex-1 font-medium text-sm text-dark">Template Library</span>
          {showPrebuiltLibrary ? (
            <ChevronDown className="w-4 h-4 text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted" />
          )}
        </button>

        {showPrebuiltLibrary && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {prebuiltTemplates.map((tpl, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:border-primary-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{tpl.name}</p>
                  <p className="text-xs text-muted truncate">{tpl.description}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-muted rounded">
                    {tpl.category}
                  </span>
                </div>
                <button
                  onClick={() => handleImportPrebuilt(tpl)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                  title="Import template"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* Template Editor - only show when a template is selected */}
      {store.selectedTemplateId ? (
        <>
          <section>
            <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wide">
              Template Elements
            </h2>

            {/* Add element buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => handleAddElement(createTextBlockElement())}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors"
                title="Add text field"
              >
                <Type className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Text</span>
              </button>
              <button
                onClick={() => handleAddElement(createBarcodeElement())}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors"
                title="Add barcode"
              >
                <QrCode className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Barcode</span>
              </button>
              <button
                onClick={() => handleAddElement(createStaticTextElement())}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors"
                title="Add static text"
              >
                <FileText className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Static</span>
              </button>
              <button
                onClick={() => handleAddElement(createDividerElement())}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors"
                title="Add divider"
              >
                <Minus className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Divider</span>
              </button>
              <button
                onClick={() => handleAddElement(createHeaderElement())}
                disabled={store.elements.some((el) => el.type === 'header')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  store.elements.some((el) => el.type === 'header')
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-border bg-white hover:border-primary-400 hover:bg-primary-50'
                }`}
                title={store.elements.some((el) => el.type === 'header') ? 'Header already exists' : 'Add header bar'}
              >
                <PanelTop className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Header</span>
              </button>
              <button
                onClick={() => handleAddElement(createFooterElement())}
                disabled={store.elements.some((el) => el.type === 'footer')}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  store.elements.some((el) => el.type === 'footer')
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-border bg-white hover:border-primary-400 hover:bg-primary-50'
                }`}
                title={store.elements.some((el) => el.type === 'footer') ? 'Footer already exists' : 'Add footer bar'}
              >
                <PanelBottom className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Footer</span>
              </button>
              <div className="relative" ref={shapePickerRef}>
                <button
                  onClick={() => setShowShapePicker(!showShapePicker)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors w-full ${
                    showShapePicker
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-border bg-white hover:border-primary-400 hover:bg-primary-50'
                  }`}
                  title="Add shape"
                >
                  <Shapes className="w-5 h-5 text-muted" />
                  <span className="text-xs text-body">Shape</span>
                </button>
                {/* Shape picker popup */}
                {showShapePicker && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-border rounded-lg shadow-lg p-2 w-56 max-h-80 overflow-y-auto">
                    <div className="text-xs text-muted font-medium mb-1 px-1">Basic</div>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      <button
                        onClick={() => { handleAddElement(createShapeElement('rectangle')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Rectangle"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('rounded-rectangle')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Rounded Rectangle"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="5" width="18" height="14" rx="4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('oval')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Oval / Circle"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('triangle')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Triangle"
                      >
                        <Triangle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('hexagon')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Hexagon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('pentagon')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Pentagon"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 22,9 19,21 5,21 2,9" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('bookmark')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Bookmark"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,2 19,2 19,22 12,17 5,22" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('price-tag')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Price Tag"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2,8 Q2,4 6,4 H22 V20 H6 Q2,20 2,16 Z M6,12 a1.5,1.5 0 1,0 0,0.01" fillRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-muted font-medium mb-1 px-1">Lines</div>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      <button
                        onClick={() => { handleAddElement(createShapeElement('line-horizontal')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Horizontal Line"
                      >
                        <MoveHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('line-vertical')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Vertical Line"
                      >
                        <MoveVertical className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('line-diagonal')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Diagonal Line"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="4" y1="20" x2="20" y2="4" />
                        </svg>
                      </button>
                      <div />
                    </div>
                    <div className="text-xs text-muted font-medium mb-1 px-1">Arrows & Symbols</div>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => { handleAddElement(createShapeElement('arrow-right')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Arrow Right"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('arrow-up')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Arrow Up"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('chevron-arrow')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Chevron Arrow"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="4,4 12,4 20,12 12,20 4,20 12,12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('diamond')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Diamond"
                      >
                        <Diamond className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('shield')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Shield"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2 L22,6 Q22,8 22,10 Q21,18 12,22 Q3,18 2,10 Q2,8 2,6 Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('cross')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Cross / Plus"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,2 H15 V9 H22 V15 H15 V22 H9 V15 H2 V9 H9 Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('starburst')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Starburst"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,1 13.5,8 20,5 15.5,10 23,12 15.5,14 20,19 13.5,16 12,23 10.5,16 4,19 8.5,14 1,12 8.5,10 4,5 10.5,8" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('star')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Star"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('heart')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Heart"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { handleAddElement(createShapeElement('speech-bubble')); setShowShapePicker(false) }}
                        className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                        title="Speech Bubble"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6l-4 4v-4H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAddElement(createTableElement())}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors"
                title="Add table"
              >
                <Table className="w-5 h-5 text-muted" />
                <span className="text-xs text-body">Table</span>
              </button>
            </div>

            {/* Elements list - sorted: header first, footer last */}
            <div className="space-y-2">
              {store.elements.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Add elements above to build your label
                </p>
              ) : (
                [...store.elements]
                  .sort((a, b) => {
                    // Headers always first
                    if (a.type === 'header') return -1
                    if (b.type === 'header') return 1
                    // Footers always last
                    if (a.type === 'footer') return 1
                    if (b.type === 'footer') return -1
                    // Keep original order for other elements
                    return 0
                  })
                  .map((el, idx, sortedArr) => (
                  <ElementEditor
                    key={el.id}
                    element={el}
                    index={idx}
                    total={sortedArr.length}
                    fieldValue={store.fieldValues[el.id] || ''}
                    onUpdate={(updates) => handleUpdateElement(el.id, updates)}
                    onDelete={() => handleDeleteElement(el.id)}
                    onMoveUp={() => handleMoveElementUp(el.id)}
                    onMoveDown={() => handleMoveElementDown(el.id)}
                    onFieldValueChange={(value) => updateFieldValue(el.id, value)}
                    shouldFocus={focusedElementId === el.id}
                    onFocusHandled={() => setFocusedElementId(null)}
                  />
                ))
              )}
            </div>
          </section>

          <hr className="border-border" />

          <DimensionEditor />

          <hr className="border-border" />

          {/* Label Appearance */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted" />
              <h2 className="text-sm font-semibold text-dark uppercase tracking-wide">
                Label Appearance
              </h2>
            </div>

            {/* Background Color */}
            <div className="space-y-3">
              <div>
                <label className="label-text">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={store.backgroundColor}
                    onChange={(e) => {
                      const newColor = e.target.value
                      store.updateTemplateSettings({ backgroundColor: newColor })
                      // Directly update preview to ensure immediate sync
                      const currentProps = usePreviewStore.getState().previewProps
                      if (currentProps) {
                        setPreviewProps({ ...currentProps, backgroundColor: newColor })
                      }
                    }}
                    className="w-10 h-8 p-0 border border-border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={store.backgroundColor}
                    onChange={(e) => {
                      const hex = e.target.value
                      // Validate hex format
                      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        store.updateTemplateSettings({ backgroundColor: hex })
                        // Directly update preview to ensure immediate sync
                        const currentProps = usePreviewStore.getState().previewProps
                        if (currentProps) {
                          setPreviewProps({ ...currentProps, backgroundColor: hex })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // If invalid, reset to current value
                      if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        e.target.value = store.backgroundColor
                      }
                    }}
                    maxLength={7}
                    className="input-field text-sm font-mono w-24"
                    placeholder="#ffffff"
                  />
                  <button
                    onClick={() => {
                      store.updateTemplateSettings({ backgroundColor: '#ffffff', backgroundOpacity: 100 })
                      // Directly update preview to ensure immediate sync
                      const currentProps = usePreviewStore.getState().previewProps
                      if (currentProps) {
                        setPreviewProps({ ...currentProps, backgroundColor: '#ffffff', backgroundOpacity: 100 })
                      }
                    }}
                    className="p-1.5 text-muted hover:text-dark hover:bg-gray-100 rounded transition-colors"
                    title="Reset to white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Background Opacity */}
              <div>
                <label className="label-text">Background Opacity</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={store.backgroundOpacity}
                    onChange={(e) => {
                      const newOpacity = Number(e.target.value)
                      store.updateTemplateSettings({ backgroundOpacity: newOpacity })
                      // Directly update preview to ensure immediate sync
                      const currentProps = usePreviewStore.getState().previewProps
                      if (currentProps) {
                        setPreviewProps({ ...currentProps, backgroundOpacity: newOpacity })
                      }
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-sm text-body font-medium w-10 text-right">
                    {store.backgroundOpacity}%
                  </span>
                </div>
                {store.backgroundOpacity < 100 && (
                  <p className="text-xs text-muted mt-1">
                    Transparent backgrounds show a checkerboard pattern in preview
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Actions */}
          <section className="space-y-3">
            <button
              onClick={() => triggerSaveToast()}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Label
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleBatchPrint}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Batch Print
              </button>
              <button
                onClick={handleExport}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export PNG
              </button>
            </div>
          </section>
        </>
      ) : (
        <div className="text-center py-8 text-muted">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select or create a template to start editing</p>
        </div>
      )}
    </div>
  )
}

// Element Editor Component
interface ElementEditorProps {
  element: TemplateElement
  index: number
  total: number
  fieldValue: string
  onUpdate: (updates: Partial<TemplateElement>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFieldValueChange: (value: string) => void
  shouldFocus?: boolean
  onFocusHandled?: () => void
}

function ElementEditor({
  element,
  index,
  total,
  fieldValue,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onFieldValueChange,
  shouldFocus,
  onFocusHandled,
}: ElementEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewInputRef = useRef<HTMLInputElement>(null)

  // Handle double-click-to-edit focus request
  useEffect(() => {
    if (shouldFocus && (element.type === 'text-block' || element.type === 'static-text')) {
      // Expand the accordion
      setExpanded(true)

      // Wait for DOM to update, then focus and scroll
      requestAnimationFrame(() => {
        // Scroll into view
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

        // Focus and select the input after a short delay for expansion animation
        setTimeout(() => {
          if (previewInputRef.current) {
            previewInputRef.current.focus()
            previewInputRef.current.select()
          }
          // Clear the focus request
          onFocusHandled?.()
        }, 100)
      })
    }
  }, [shouldFocus, element.type, onFocusHandled])

  const getShapeDisplayName = (shapeType: ShapeType): string => {
    const names: Record<ShapeType, string> = {
      rectangle: 'Rectangle',
      oval: 'Oval',
      triangle: 'Triangle',
      star: 'Star',
      'line-horizontal': 'Horizontal Line',
      'line-vertical': 'Vertical Line',
      'line-diagonal': 'Diagonal Line',
      'arrow-right': 'Arrow Right',
      'arrow-up': 'Arrow Up',
      heart: 'Heart',
      diamond: 'Diamond',
      'speech-bubble': 'Speech Bubble',
      hexagon: 'Hexagon',
      pentagon: 'Pentagon',
      bookmark: 'Bookmark',
      'price-tag': 'Price Tag',
      shield: 'Shield',
      'chevron-arrow': 'Chevron Arrow',
      'rounded-rectangle': 'Rounded Rectangle',
      starburst: 'Starburst',
      cross: 'Cross',
    }
    return names[shapeType] || 'Shape'
  }

  const getElementIcon = () => {
    switch (element.type) {
      case 'text-block':
        return <Type className="w-4 h-4" />
      case 'barcode':
        return <QrCode className="w-4 h-4" />
      case 'static-text':
        return <FileText className="w-4 h-4" />
      case 'divider':
        return <Minus className="w-4 h-4" />
      case 'header':
        return <PanelTop className="w-4 h-4" />
      case 'footer':
        return <PanelBottom className="w-4 h-4" />
      case 'shape':
        return <Shapes className="w-4 h-4" />
      case 'table':
        return <Table className="w-4 h-4" />
    }
  }

  const getElementLabel = () => {
    switch (element.type) {
      case 'text-block':
        return (element as TextBlockElement).label
      case 'barcode':
        return (element as BarcodeTemplateElement).label
      case 'static-text':
        return `"${(element as StaticTextElement).content.substring(0, 20)}${(element as StaticTextElement).content.length > 20 ? '...' : ''}"`
      case 'divider':
        return 'Divider'
      case 'header':
        return `Header: "${(element as HeaderElement).content.substring(0, 15)}${(element as HeaderElement).content.length > 15 ? '...' : ''}"`
      case 'footer':
        return `Footer: "${(element as FooterElement).content.substring(0, 15)}${(element as FooterElement).content.length > 15 ? '...' : ''}"`
      case 'shape':
        return getShapeDisplayName((element as ShapeElement).shapeType)
      case 'table':
        const tbl = element as TableElement
        return `Table (${tbl.columns}×${tbl.rows})`
    }
  }

  return (
    <div ref={containerRef} className="border border-border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted" />
        )}
        <span className="text-muted">{getElementIcon()}</span>
        <span className="flex-1 text-sm font-medium text-body truncate">
          {getElementLabel()}
        </span>

        {/* Lock indicator - shows for locked elements and always for header/footer */}
        {(element.locked || element.type === 'header' || element.type === 'footer') && (
          <span title={element.type === 'header' || element.type === 'footer' ? 'Position is fixed' : 'Locked'}>
            <Lock className="w-3 h-3 text-blue-500" />
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp() }}
          disabled={index === 0 || element.type === 'header' || element.type === 'footer' || element.locked}
          className="p-1 text-muted hover:text-dark disabled:opacity-30"
          title={element.type === 'header' || element.type === 'footer' ? 'Position is fixed' : element.locked ? 'Locked' : undefined}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown() }}
          disabled={index === total - 1 || element.type === 'header' || element.type === 'footer' || element.locked}
          className="p-1 text-muted hover:text-dark disabled:opacity-30"
          title={element.type === 'header' || element.type === 'footer' ? 'Position is fixed' : element.locked ? 'Locked' : undefined}
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (element.locked) return
            // Show confirmation for header/footer deletion
            if (element.type === 'header' || element.type === 'footer') {
              const elementName = element.type === 'header' ? 'header bar' : 'footer bar'
              if (window.confirm(`Remove ${elementName}?`)) {
                onDelete()
              }
            } else {
              onDelete()
            }
          }}
          disabled={element.locked}
          className={`p-1 ${element.locked ? 'text-muted opacity-30 cursor-not-allowed' : 'text-muted hover:text-error'}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
          {element.type === 'text-block' && (
            <TextBlockEditor
              element={element as TextBlockElement}
              fieldValue={fieldValue}
              onUpdate={onUpdate}
              onFieldValueChange={onFieldValueChange}
              previewInputRef={previewInputRef}
            />
          )}
          {element.type === 'barcode' && (
            <BarcodeEditor
              element={element as BarcodeTemplateElement}
              fieldValue={fieldValue}
              onUpdate={onUpdate}
              onFieldValueChange={onFieldValueChange}
            />
          )}
          {element.type === 'static-text' && (
            <StaticTextEditor
              element={element as StaticTextElement}
              onUpdate={onUpdate}
              contentInputRef={previewInputRef}
            />
          )}
          {element.type === 'divider' && (
            <DividerEditor
              element={element}
              onUpdate={onUpdate}
            />
          )}
          {element.type === 'header' && (
            <HeaderFooterEditor
              element={element as HeaderElement}
              onUpdate={onUpdate}
              type="header"
            />
          )}
          {element.type === 'footer' && (
            <HeaderFooterEditor
              element={element as FooterElement}
              onUpdate={onUpdate}
              type="footer"
            />
          )}
          {element.type === 'shape' && (
            <ShapeEditor
              element={element as ShapeElement}
              onUpdate={onUpdate}
            />
          )}
          {element.type === 'table' && (
            <TableEditor
              element={element as TableElement}
              onUpdate={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Individual element type editors
function TextBlockEditor({
  element,
  fieldValue,
  onUpdate,
  onFieldValueChange,
  previewInputRef,
}: {
  element: TextBlockElement
  fieldValue: string
  onUpdate: (updates: Partial<TextBlockElement>) => void
  onFieldValueChange: (value: string) => void
  previewInputRef?: React.RefObject<HTMLInputElement>
}) {
  return (
    <>
      <div>
        <label className="label-text">Field Label</label>
        <input
          type="text"
          className="input-field text-sm"
          value={element.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>
      <div>
        <label className="label-text">Preview <span className="text-muted font-normal">(design only)</span></label>
        <input
          ref={previewInputRef}
          type="text"
          className="input-field text-sm"
          placeholder={element.placeholder}
          value={fieldValue}
          onChange={(e) => onFieldValueChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label-text">Size</label>
          <select
            className="input-field text-sm"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          >
            <option value={8}>8pt</option>
            <option value={10}>10pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
            <option value={16}>16pt</option>
            <option value={18}>18pt</option>
            <option value={24}>24pt</option>
          </select>
        </div>
        <div>
          <label className="label-text">Weight</label>
          <select
            className="input-field text-sm"
            value={element.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: e.target.value as 'normal' | 'bold' })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div>
          <label className="label-text">Align</label>
          <select
            className="input-field text-sm"
            value={element.textAlign}
            onChange={(e) => onUpdate({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </>
  )
}

// QR Style thumbnail preview component
function QrStylePreview({
  style,
  type
}: {
  style: string
  type: 'dots' | 'corners' | 'cornersShape'
}) {
  // Generate a mini QR-like preview for each style
  const renderDotsPreview = (s: string) => {
    const dotStyles: Record<string, string> = {
      'square': 'M2,2 h4 v4 h-4 z M8,2 h4 v4 h-4 z M14,2 h4 v4 h-4 z M2,8 h4 v4 h-4 z M14,8 h4 v4 h-4 z M2,14 h4 v4 h-4 z M8,14 h4 v4 h-4 z M14,14 h4 v4 h-4 z',
      'rounded': 'M2,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M8,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M14,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M2,10 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M14,10 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M2,16 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M8,16 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M14,16 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0',
      'dots': '',
      'extra-rounded': 'M2,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M8,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M14,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0',
      'classy': 'M2,2 h4 v4 h-4 z M8,2 h4 v4 h-4 z M14,2 h4 v4 h-4 z',
      'classy-rounded': 'M2,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0 M8,4 a2,2 0 0,1 4,0 a2,2 0 0,1 -4,0',
    }
    const isDots = s === 'dots'
    return (
      <svg viewBox="0 0 20 20" className="w-full h-full">
        {isDots ? (
          <>
            <circle cx="4" cy="4" r="2" fill="black" />
            <circle cx="10" cy="4" r="2" fill="black" />
            <circle cx="16" cy="4" r="2" fill="black" />
            <circle cx="4" cy="10" r="2" fill="black" />
            <circle cx="16" cy="10" r="2" fill="black" />
            <circle cx="4" cy="16" r="2" fill="black" />
            <circle cx="10" cy="16" r="2" fill="black" />
            <circle cx="16" cy="16" r="2" fill="black" />
          </>
        ) : (
          <path d={dotStyles[s] || dotStyles['square']} fill="black" />
        )}
      </svg>
    )
  }

  const renderCornersPreview = (s: string) => {
    // Corner eye frame styles
    if (s === 'square') {
      return (
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <rect x="2" y="2" width="16" height="16" fill="none" stroke="black" strokeWidth="2" />
          <rect x="6" y="6" width="8" height="8" fill="black" />
        </svg>
      )
    } else if (s === 'extra-rounded') {
      return (
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="none" stroke="black" strokeWidth="2" />
          <rect x="6" y="6" width="8" height="8" rx="2" fill="black" />
        </svg>
      )
    } else {
      return (
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <circle cx="10" cy="10" r="8" fill="none" stroke="black" strokeWidth="2" />
          <circle cx="10" cy="10" r="4" fill="black" />
        </svg>
      )
    }
  }

  const renderCornersShapePreview = (s: string) => {
    // Corner dot shape
    if (s === 'square') {
      return (
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <rect x="2" y="2" width="16" height="16" fill="none" stroke="black" strokeWidth="1.5" />
          <rect x="5" y="5" width="10" height="10" fill="black" />
        </svg>
      )
    } else {
      return (
        <svg viewBox="0 0 20 20" className="w-full h-full">
          <rect x="2" y="2" width="16" height="16" fill="none" stroke="black" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="5" fill="black" />
        </svg>
      )
    }
  }

  if (type === 'dots') return renderDotsPreview(style)
  if (type === 'corners') return renderCornersPreview(style)
  return renderCornersShapePreview(style)
}

// QR Style visual picker
function QrStylePicker<T extends string>({
  label,
  options,
  value,
  onChange,
  type,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  type: 'dots' | 'corners' | 'cornersShape'
}) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              p-1.5 rounded border-2 transition-all
              ${value === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
            title={opt.label}
          >
            <div className="w-8 h-8 mx-auto bg-white rounded flex items-center justify-center">
              <QrStylePreview style={opt.value} type={type} />
            </div>
            <div className="text-[9px] text-center mt-0.5 text-gray-600 truncate">
              {opt.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function BarcodeEditor({
  element,
  fieldValue,
  onUpdate,
  onFieldValueChange,
}: {
  element: BarcodeTemplateElement
  fieldValue: string
  onUpdate: (updates: Partial<BarcodeTemplateElement>) => void
  onFieldValueChange: (value: string) => void
}) {
  const [qrStyleOpen, setQrStyleOpen] = useState(false)
  const isQrCode = element.barcodeType === 'qrcode'

  const dotsStyleOptions: { value: QrDotsStyle; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'dots', label: 'Dots' },
    { value: 'extra-rounded', label: 'Extra Rounded' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Rounded' },
  ]

  const cornersStyleOptions: { value: QrCornersStyle; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'extra-rounded', label: 'Extra Rounded' },
    { value: 'dot', label: 'Dot' },
  ]

  const cornersShapeOptions: { value: QrCornersShape; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
  ]

  return (
    <>
      <div>
        <label className="label-text">Field Label</label>
        <input
          type="text"
          className="input-field text-sm"
          value={element.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>
      <div>
        <label className="label-text">Preview Data <span className="text-muted font-normal">(design only)</span></label>
        <input
          type="text"
          className="input-field text-sm font-mono"
          placeholder="12345"
          value={fieldValue}
          onChange={(e) => onFieldValueChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Type</label>
          <select
            className="input-field text-sm"
            value={element.barcodeType}
            onChange={(e) => onUpdate({ barcodeType: e.target.value as BarcodeType })}
          >
            <option value="code128">Code 128</option>
            <option value="code39">Code 39</option>
            <option value="qrcode">QR Code</option>
            <option value="datamatrix">Data Matrix</option>
            <option value="pdf417">PDF417</option>
          </select>
        </div>
        <div>
          <label className="label-text">Show Text</label>
          <select
            className="input-field text-sm"
            value={element.showText ? 'yes' : 'no'}
            onChange={(e) => onUpdate({ showText: e.target.value === 'yes' })}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* QR Style Section - only visible for QR Code */}
      {isQrCode && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mt-2">
          <button
            type="button"
            onClick={() => setQrStyleOpen(!qrStyleOpen)}
            className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">QR Style</span>
            {qrStyleOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {qrStyleOpen && (
            <div className="p-3 space-y-4 bg-white">
              <QrStylePicker
                label="Dots Style (شكل النقاط)"
                options={dotsStyleOptions}
                value={element.qrDotsStyle || 'square'}
                onChange={(v) => onUpdate({ qrDotsStyle: v })}
                type="dots"
              />
              <QrStylePicker
                label="Corner Eyes Style (شكل إطار الزاوية)"
                options={cornersStyleOptions}
                value={element.qrCornersStyle || 'square'}
                onChange={(v) => onUpdate({ qrCornersStyle: v })}
                type="corners"
              />
              <QrStylePicker
                label="Corner Eyes Shape (شكل نقطة الزاوية)"
                options={cornersShapeOptions}
                value={element.qrCornersShape || 'square'}
                onChange={(v) => onUpdate({ qrCornersShape: v })}
                type="cornersShape"
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

function StaticTextEditor({
  element,
  onUpdate,
  contentInputRef,
}: {
  element: StaticTextElement
  onUpdate: (updates: Partial<StaticTextElement>) => void
  contentInputRef?: React.RefObject<HTMLInputElement>
}) {
  return (
    <>
      <div>
        <label className="label-text">Text Content</label>
        <input
          ref={contentInputRef}
          type="text"
          className="input-field text-sm"
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label-text">Size</label>
          <select
            className="input-field text-sm"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          >
            <option value={8}>8pt</option>
            <option value={10}>10pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
            <option value={16}>16pt</option>
            <option value={18}>18pt</option>
            <option value={24}>24pt</option>
          </select>
        </div>
        <div>
          <label className="label-text">Weight</label>
          <select
            className="input-field text-sm"
            value={element.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: e.target.value as 'normal' | 'bold' })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div>
          <label className="label-text">Align</label>
          <select
            className="input-field text-sm"
            value={element.textAlign}
            onChange={(e) => onUpdate({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </>
  )
}

function DividerEditor({
  element,
  onUpdate,
}: {
  element: TemplateElement
  onUpdate: (updates: Partial<TemplateElement>) => void
}) {
  const divider = element as DividerElement
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="label-text">Style</label>
        <select
          className="input-field text-sm"
          value={divider.style}
          onChange={(e) => onUpdate({ style: e.target.value as 'solid' | 'dashed' | 'dotted' })}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div>
        <label className="label-text">Thickness</label>
        <select
          className="input-field text-sm"
          value={divider.thickness}
          onChange={(e) => onUpdate({ thickness: Number(e.target.value) })}
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={3}>3px</option>
        </select>
      </div>
    </div>
  )
}

function HeaderFooterEditor({
  element,
  onUpdate,
  type,
}: {
  element: HeaderElement | FooterElement
  onUpdate: (updates: Partial<HeaderElement | FooterElement>) => void
  type: 'header' | 'footer'
}) {
  return (
    <div className="space-y-3">
      {/* Text Content */}
      <div>
        <label className="label-text">Text Content</label>
        <input
          type="text"
          className="input-field text-sm"
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder={type === 'header' ? 'Header text...' : 'Footer text...'}
        />
      </div>

      {/* Text Style Row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label-text">Size</label>
          <select
            className="input-field text-sm"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) as 8 | 10 | 12 | 14 })}
          >
            <option value={8}>8pt</option>
            <option value={10}>10pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
          </select>
        </div>
        <div>
          <label className="label-text">Weight</label>
          <select
            className="input-field text-sm"
            value={element.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: e.target.value as 'normal' | 'bold' })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div>
          <label className="label-text">Align</label>
          <select
            className="input-field text-sm"
            value={element.textAlign}
            onChange={(e) => onUpdate({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      {/* Colors Row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.textColor}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.textColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ textColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
        <div>
          <label className="label-text">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.backgroundColor}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.backgroundColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ backgroundColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
      </div>

      {/* Background Opacity */}
      <div>
        <label className="label-text">Background Opacity</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={element.backgroundOpacity}
            onChange={(e) => onUpdate({ backgroundOpacity: Number(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-sm text-body font-medium w-10 text-right">
            {element.backgroundOpacity}%
          </span>
        </div>
      </div>

      {/* Height */}
      <div>
        <label className="label-text">Height</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={4}
            max={16}
            step={1}
            value={element.barHeight}
            onChange={(e) => onUpdate({ barHeight: Number(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-sm text-body font-medium w-12 text-right">
            {element.barHeight}mm
          </span>
        </div>
      </div>
    </div>
  )
}

function ShapeEditor({
  element,
  onUpdate,
}: {
  element: ShapeElement
  onUpdate: (updates: Partial<ShapeElement>) => void
}) {
  const isLine = element.shapeType.startsWith('line-')

  const shapeNames: Record<ShapeType, string> = {
    rectangle: 'Rectangle',
    oval: 'Oval',
    triangle: 'Triangle',
    star: 'Star',
    'line-horizontal': 'Horizontal Line',
    'line-vertical': 'Vertical Line',
    'line-diagonal': 'Diagonal Line',
    'arrow-right': 'Arrow Right',
    'arrow-up': 'Arrow Up',
    heart: 'Heart',
    diamond: 'Diamond',
    'speech-bubble': 'Speech Bubble',
    hexagon: 'Hexagon',
    pentagon: 'Pentagon',
    bookmark: 'Bookmark',
    'price-tag': 'Price Tag',
    shield: 'Shield',
    'chevron-arrow': 'Chevron Arrow',
    'rounded-rectangle': 'Rounded Rectangle',
    starburst: 'Starburst',
    cross: 'Cross',
  }

  return (
    <div className="space-y-3">
      {/* Shape Type (read-only display) */}
      <div>
        <label className="label-text">Shape Type</label>
        <div className="text-sm text-body font-medium">
          {shapeNames[element.shapeType]}
        </div>
      </div>

      {/* Fill Section */}
      {!isLine && (
        <>
          <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Fill</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-text">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.fillColor}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.fillColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onUpdate({ fillColor: e.target.value })
                    }
                  }}
                  maxLength={7}
                  className="input-field text-sm font-mono flex-1"
                />
              </div>
            </div>
            <div>
              <label className="label-text">Style</label>
              <select
                className="input-field text-sm"
                value={element.fillStyle}
                onChange={(e) => onUpdate({ fillStyle: e.target.value as 'filled' | 'outline' | 'none' })}
              >
                <option value="filled">Filled</option>
                <option value="outline">Outline Only</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-text">Fill Opacity</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={element.fillOpacity}
                onChange={(e) => onUpdate({ fillOpacity: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-sm text-body font-medium w-10 text-right">
                {element.fillOpacity}%
              </span>
            </div>
          </div>
        </>
      )}

      {/* Stroke Section */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Stroke</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.strokeColor}
              onChange={(e) => onUpdate({ strokeColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.strokeColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ strokeColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
        <div>
          <label className="label-text">Style</label>
          <select
            className="input-field text-sm"
            value={element.strokeStyle}
            onChange={(e) => onUpdate({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-text">Stroke Width</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={element.strokeWidth}
            onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-sm text-body font-medium w-10 text-right">
            {element.strokeWidth}px
          </span>
        </div>
      </div>

      {/* Dimensions Section */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Dimensions</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Width (mm)</label>
          <input
            type="number"
            min={1}
            max={36}
            step={0.5}
            value={element.width ?? 10}
            onChange={(e) => {
              const newWidth = Math.max(1, Math.min(36, Number(e.target.value)))
              if (element.lockAspectRatio && element.width && element.height) {
                const ratio = element.height / element.width
                onUpdate({ width: newWidth, height: newWidth * ratio })
              } else {
                onUpdate({ width: newWidth })
              }
            }}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="label-text">Height (mm)</label>
          <input
            type="number"
            min={1}
            max={86}
            step={0.5}
            value={element.height ?? 10}
            onChange={(e) => {
              const newHeight = Math.max(1, Math.min(86, Number(e.target.value)))
              if (element.lockAspectRatio && element.width && element.height) {
                const ratio = element.width / element.height
                onUpdate({ height: newHeight, width: newHeight * ratio })
              } else {
                onUpdate({ height: newHeight })
              }
            }}
            className="input-field text-sm"
            disabled={isLine}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="lock-aspect-ratio"
          checked={element.lockAspectRatio}
          onChange={(e) => onUpdate({ lockAspectRatio: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="lock-aspect-ratio" className="text-sm text-body">
          Lock aspect ratio
        </label>
      </div>

      {/* Position Section */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Position</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">X (mm)</label>
          <input
            type="number"
            min={0}
            max={36}
            step={0.5}
            value={element.posX ?? 0}
            onChange={(e) => onUpdate({ posX: Math.max(0, Number(e.target.value)) })}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="label-text">Y (mm)</label>
          <input
            type="number"
            min={0}
            max={86}
            step={0.5}
            value={element.posY ?? 0}
            onChange={(e) => onUpdate({ posY: Math.max(0, Number(e.target.value)) })}
            className="input-field text-sm"
          />
        </div>
      </div>
    </div>
  )
}

function TableEditor({
  element,
  onUpdate,
}: {
  element: TableElement
  onUpdate: (updates: Partial<TableElement>) => void
}) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  // Get the selected cell data
  const getCell = (row: number, col: number): TableCell | undefined => {
    return element.cells.find((c) => c.row === row && c.col === col)
  }

  // Update a specific cell
  const updateCell = (row: number, col: number, updates: Partial<TableCell>) => {
    const newCells = element.cells.map((c) =>
      c.row === row && c.col === col ? { ...c, ...updates } : c
    )
    onUpdate({ cells: newCells })
  }

  // Add a row
  const addRow = () => {
    if (element.rows >= 10) return
    const newRow = element.rows
    const newCells: TableCell[] = []
    for (let c = 0; c < element.columns; c++) {
      newCells.push({
        row: newRow,
        col: c,
        content: '',
        isField: false,
        fontSize: 8,
        fontWeight: 'normal',
        textAlign: 'center',
      })
    }
    const newHeight = (element.rows + 1) * element.rowHeight
    onUpdate({ rows: element.rows + 1, cells: [...element.cells, ...newCells], height: newHeight })
  }

  // Remove last row
  const removeRow = () => {
    if (element.rows <= 1) return
    const newCells = element.cells.filter((c) => c.row < element.rows - 1)
    const newHeight = (element.rows - 1) * element.rowHeight
    onUpdate({ rows: element.rows - 1, cells: newCells, height: newHeight })
    if (selectedCell && selectedCell.row >= element.rows - 1) {
      setSelectedCell(null)
    }
  }

  // Add a column
  const addColumn = () => {
    if (element.columns >= 6) return
    const newCol = element.columns
    const newCells: TableCell[] = []
    for (let r = 0; r < element.rows; r++) {
      newCells.push({
        row: r,
        col: newCol,
        content: r === 0 ? `Header ${newCol + 1}` : '',
        isField: false,
        fontSize: r === 0 ? 10 : 8,
        fontWeight: r === 0 ? 'bold' : 'normal',
        textAlign: 'center',
      })
    }
    onUpdate({ columns: element.columns + 1, cells: [...element.cells, ...newCells] })
  }

  // Remove last column
  const removeColumn = () => {
    if (element.columns <= 1) return
    const newCells = element.cells.filter((c) => c.col < element.columns - 1)
    onUpdate({ columns: element.columns - 1, cells: newCells })
    if (selectedCell && selectedCell.col >= element.columns - 1) {
      setSelectedCell(null)
    }
  }

  const selectedCellData = selectedCell ? getCell(selectedCell.row, selectedCell.col) : null

  return (
    <div className="space-y-3">
      {/* Structure */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide">Structure</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Columns</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={6}
              value={element.columns}
              onChange={(e) => {
                const newCols = Math.max(1, Math.min(6, Number(e.target.value)))
                if (newCols > element.columns) {
                  // Add columns
                  const newCells: TableCell[] = []
                  for (let c = element.columns; c < newCols; c++) {
                    for (let r = 0; r < element.rows; r++) {
                      newCells.push({
                        row: r,
                        col: c,
                        content: r === 0 ? `Header ${c + 1}` : '',
                        isField: false,
                        fontSize: r === 0 ? 10 : 8,
                        fontWeight: r === 0 ? 'bold' : 'normal',
                        textAlign: 'center',
                      })
                    }
                  }
                  onUpdate({ columns: newCols, cells: [...element.cells, ...newCells] })
                } else if (newCols < element.columns) {
                  // Remove columns
                  const newCells = element.cells.filter((c) => c.col < newCols)
                  onUpdate({ columns: newCols, cells: newCells })
                }
              }}
              className="input-field text-sm flex-1"
            />
          </div>
        </div>
        <div>
          <label className="label-text">Rows</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={10}
              value={element.rows}
              onChange={(e) => {
                const newRows = Math.max(1, Math.min(10, Number(e.target.value)))
                if (newRows > element.rows) {
                  // Add rows
                  const newCells: TableCell[] = []
                  for (let r = element.rows; r < newRows; r++) {
                    for (let c = 0; c < element.columns; c++) {
                      newCells.push({
                        row: r,
                        col: c,
                        content: '',
                        isField: false,
                        fontSize: 8,
                        fontWeight: 'normal',
                        textAlign: 'center',
                      })
                    }
                  }
                  const newHeight = newRows * element.rowHeight
                  onUpdate({ rows: newRows, cells: [...element.cells, ...newCells], height: newHeight })
                } else if (newRows < element.rows) {
                  // Remove rows
                  const newCells = element.cells.filter((c) => c.row < newRows)
                  const newHeight = newRows * element.rowHeight
                  onUpdate({ rows: newRows, cells: newCells, height: newHeight })
                }
              }}
              className="input-field text-sm flex-1"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={addRow}
          disabled={element.rows >= 10}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          + Row
        </button>
        <button
          onClick={removeRow}
          disabled={element.rows <= 1}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          - Row
        </button>
        <button
          onClick={addColumn}
          disabled={element.columns >= 6}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          + Col
        </button>
        <button
          onClick={removeColumn}
          disabled={element.columns <= 1}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          - Col
        </button>
      </div>

      {/* Cell Grid Preview */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Click Cell to Edit</div>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {Array.from({ length: element.rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: element.columns }).map((_, c) => {
                  const cell = getCell(r, c)
                  const isSelected = selectedCell?.row === r && selectedCell?.col === c
                  const isHeader = element.hasHeaderRow && r === 0
                  return (
                    <td
                      key={c}
                      onClick={() => setSelectedCell({ row: r, col: c })}
                      className={`border border-gray-300 px-1 py-0.5 cursor-pointer truncate max-w-[60px] ${
                        isSelected ? 'bg-primary-100 outline outline-2 outline-primary-500' : ''
                      } ${isHeader ? 'bg-gray-100 font-bold' : ''}`}
                    >
                      {cell?.content || <span className="text-gray-400">...</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Editor */}
      {selectedCellData && (
        <>
          <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">
            Cell ({selectedCell!.row + 1}, {selectedCell!.col + 1})
          </div>
          <div>
            <label className="label-text">Content</label>
            <input
              type="text"
              value={selectedCellData.content}
              onChange={(e) => updateCell(selectedCell!.row, selectedCell!.col, { content: e.target.value })}
              className="input-field text-sm"
              placeholder="Cell text..."
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label-text">Size</label>
              <select
                className="input-field text-sm"
                value={selectedCellData.fontSize}
                onChange={(e) => updateCell(selectedCell!.row, selectedCell!.col, { fontSize: Number(e.target.value) as 6 | 8 | 10 | 12 })}
              >
                <option value={6}>6pt</option>
                <option value={8}>8pt</option>
                <option value={10}>10pt</option>
                <option value={12}>12pt</option>
              </select>
            </div>
            <div>
              <label className="label-text">Weight</label>
              <select
                className="input-field text-sm"
                value={selectedCellData.fontWeight}
                onChange={(e) => updateCell(selectedCell!.row, selectedCell!.col, { fontWeight: e.target.value as 'normal' | 'bold' })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className="label-text">Align</label>
              <select
                className="input-field text-sm"
                value={selectedCellData.textAlign}
                onChange={(e) => updateCell(selectedCell!.row, selectedCell!.col, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Table Styling */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Table Styling</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Border Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.borderColor}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.borderColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ borderColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
        <div>
          <label className="label-text">Border Style</label>
          <select
            className="input-field text-sm"
            value={element.borderStyle}
            onChange={(e) => onUpdate({ borderStyle: e.target.value as 'solid' | 'dashed' | 'none' })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-text">Border Width</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={element.borderWidth}
            onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <span className="text-sm text-body font-medium w-10 text-right">
            {element.borderWidth}px
          </span>
        </div>
      </div>

      {/* Header Row */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="has-header-row"
          checked={element.hasHeaderRow}
          onChange={(e) => onUpdate({ hasHeaderRow: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="has-header-row" className="text-sm text-body">
          First row is header
        </label>
      </div>
      {element.hasHeaderRow && (
        <div>
          <label className="label-text">Header Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.headerBgColor}
              onChange={(e) => onUpdate({ headerBgColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.headerBgColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ headerBgColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
      )}

      {/* Cell Padding & Row Height */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">Cell Padding</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={element.cellPadding}
              onChange={(e) => onUpdate({ cellPadding: Number(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="text-sm text-body font-medium w-10 text-right">
              {element.cellPadding}mm
            </span>
          </div>
        </div>
        <div>
          <label className="label-text">Row Height</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={4}
              max={12}
              step={1}
              value={element.rowHeight}
              onChange={(e) => {
                const newRowHeight = Number(e.target.value)
                const newHeight = element.rows * newRowHeight
                onUpdate({ rowHeight: newRowHeight, height: newHeight })
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="text-sm text-body font-medium w-10 text-right">
              {element.rowHeight}mm
            </span>
          </div>
        </div>
      </div>

      {/* Alternating Rows */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="alternating-rows"
          checked={element.alternatingRows}
          onChange={(e) => onUpdate({ alternatingRows: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="alternating-rows" className="text-sm text-body">
          Alternating row colors
        </label>
      </div>
      {element.alternatingRows && (
        <div>
          <label className="label-text">Alternating Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.alternatingColor}
              onChange={(e) => onUpdate({ alternatingColor: e.target.value })}
              className="w-8 h-8 p-0 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={element.alternatingColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onUpdate({ alternatingColor: e.target.value })
                }
              }}
              maxLength={7}
              className="input-field text-sm font-mono flex-1"
            />
          </div>
        </div>
      )}

      {/* Dimensions */}
      <div className="text-xs text-muted font-medium uppercase tracking-wide pt-1">Position</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-text">X (mm)</label>
          <input
            type="number"
            min={0}
            max={36}
            step={0.5}
            value={element.posX ?? 0}
            onChange={(e) => onUpdate({ posX: Math.max(0, Number(e.target.value)) })}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="label-text">Y (mm)</label>
          <input
            type="number"
            min={0}
            max={86}
            step={0.5}
            value={element.posY ?? 0}
            onChange={(e) => onUpdate({ posY: Math.max(0, Number(e.target.value)) })}
            className="input-field text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default DepartmentWorkspace
