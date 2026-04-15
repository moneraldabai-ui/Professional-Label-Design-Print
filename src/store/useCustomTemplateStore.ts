import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BarcodeType } from '../types/barcode'
import { useSettingsStore } from './useSettingsStore'

// Element types for template building
export type TemplateElementType = 'text-block' | 'barcode' | 'static-text' | 'divider' | 'header' | 'footer' | 'shape' | 'table'

// QR Code styling types
export type QrDotsStyle = 'square' | 'rounded' | 'dots' | 'extra-rounded' | 'classy' | 'classy-rounded'
export type QrCornersStyle = 'square' | 'extra-rounded' | 'dot'
export type QrCornersShape = 'square' | 'dot'

// Shape types available
export type ShapeType =
  | 'rectangle'
  | 'oval'
  | 'triangle'
  | 'star'
  | 'line-horizontal'
  | 'line-vertical'
  | 'line-diagonal'
  | 'arrow-right'
  | 'arrow-up'
  | 'heart'
  | 'diamond'
  | 'speech-bubble'
  | 'hexagon'
  | 'pentagon'
  | 'bookmark'
  | 'price-tag'
  | 'shield'
  | 'chevron-arrow'
  | 'rounded-rectangle'
  | 'starburst'
  | 'cross'

// Rotation options (legacy preset angles)
export type RotationAngle = 0 | 90 | 180 | 270

interface BaseTemplateElement {
  id: string
  type: TemplateElementType
  rotation: RotationAngle
  // Free positioning (mm from label top-left). Undefined = auto-layout
  posX?: number
  posY?: number
  // Explicit size in mm. Undefined = auto-sized based on content
  width?: number
  height?: number
  // Free rotation in degrees (0-360), overrides rotation when set
  freeRotation?: number
  // Scale factor (1.0 = 100%)
  absScale?: number
  // Flip transforms
  flipH?: boolean
  flipV?: boolean
  // Layer order
  zIndex?: number
  // Lock state - prevents editing when true
  locked?: boolean
}

export interface TextBlockElement extends BaseTemplateElement {
  type: 'text-block'
  label: string
  placeholder: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

export interface BarcodeTemplateElement extends BaseTemplateElement {
  type: 'barcode'
  label: string
  barcodeType: BarcodeType
  showText: boolean
  // QR Code styling (only applies when barcodeType is 'qrcode')
  qrDotsStyle?: QrDotsStyle
  qrCornersStyle?: QrCornersStyle
  qrCornersShape?: QrCornersShape
}

export interface StaticTextElement extends BaseTemplateElement {
  type: 'static-text'
  content: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

export interface DividerElement extends BaseTemplateElement {
  type: 'divider'
  style: 'solid' | 'dashed' | 'dotted'
  thickness: number
}

export interface HeaderElement extends BaseTemplateElement {
  type: 'header'
  content: string
  fontSize: 8 | 10 | 12 | 14
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  textColor: string // hex color, default #ffffff
  backgroundColor: string // hex color, default #2563eb
  backgroundOpacity: number // 0-100, default 100
  barHeight: number // mm, 4-16, default 8
}

export interface FooterElement extends BaseTemplateElement {
  type: 'footer'
  content: string
  fontSize: 8 | 10 | 12 | 14
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  textColor: string // hex color, default #ffffff
  backgroundColor: string // hex color, default #1e293b
  backgroundOpacity: number // 0-100, default 100
  barHeight: number // mm, 4-16, default 8
}

export interface ShapeElement extends BaseTemplateElement {
  type: 'shape'
  shapeType: ShapeType
  // Fill properties
  fillColor: string // hex color, default #000000
  fillOpacity: number // 0-100, default 100
  fillStyle: 'filled' | 'outline' | 'none'
  // Stroke properties
  strokeColor: string // hex color, default #000000
  strokeWidth: number // 0-8 px, default 2
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  // Aspect ratio lock
  lockAspectRatio: boolean
}

// Table cell structure
export interface TableCell {
  row: number
  col: number
  content: string
  isField: boolean // true if content is a dynamic field
  fieldId?: string // ID for field binding
  fontSize: 6 | 8 | 10 | 12
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

export interface TableElement extends BaseTemplateElement {
  type: 'table'
  // Structure
  columns: number // 1-6
  rows: number // 1-10
  cells: TableCell[]
  // Border styling
  borderColor: string // hex color, default #000000
  borderWidth: number // 0-3 px, default 1
  borderStyle: 'solid' | 'dashed' | 'none'
  // Header row
  hasHeaderRow: boolean
  headerBgColor: string // hex color, default #e5e7eb
  // Cell styling
  cellPadding: number // 1-4 mm, default 2
  rowHeight: number // 4-12 mm per row, default 6
  // Alternating rows
  alternatingRows: boolean
  alternatingColor: string // hex color, default #f9fafb
  // Lock width to label
  lockWidthToLabel: boolean
}

export type TemplateElement = TextBlockElement | BarcodeTemplateElement | StaticTextElement | DividerElement | HeaderElement | FooterElement | ShapeElement | TableElement

export interface Template {
  id: string
  name: string
  elements: TemplateElement[]
  createdAt: string
  updatedAt: string
  // Label appearance
  backgroundColor?: string // hex color, default #ffffff
  backgroundOpacity?: number // 0-100, default 100
}

export interface CustomDepartment {
  id: string
  name: string
  templates: Template[]
  createdAt: string
}

interface CustomTemplateState {
  // Departments
  departments: CustomDepartment[]
  selectedDepartmentId: string | null
  selectedTemplateId: string | null

  // Preview field values per template — design-only (keyed by templateId → elementId → value)
  previewValues: Record<string, Record<string, string>>

  // Department tab field values — real print data (keyed by templateId → elementId → value)
  deptFieldValues: Record<string, Record<string, string>>

  // Department operations
  addDepartment: (name: string) => string
  renameDepartment: (id: string, name: string) => void
  deleteDepartment: (id: string) => void
  selectDepartment: (id: string | null) => void

  // Template operations
  addTemplate: (departmentId: string, name: string) => string
  renameTemplate: (departmentId: string, templateId: string, name: string) => void
  deleteTemplate: (departmentId: string, templateId: string) => void
  selectTemplate: (departmentId: string, templateId: string) => void

  // Element operations — write directly to departments[].templates[].elements
  addElement: (element: TemplateElement) => void
  updateElement: (id: string, updates: Partial<TemplateElement>) => void
  deleteElement: (id: string) => void
  moveElementUp: (id: string) => void
  moveElementDown: (id: string) => void

  // Bulk-replace elements (used by undo/redo)
  setElements: (elements: TemplateElement[]) => void

  // Template settings (background color, etc.)
  updateTemplateSettings: (updates: { backgroundColor?: string; backgroundOpacity?: number }) => void

  // Preview value operations (design-only, Templates tab)
  setPreviewValue: (templateId: string, elementId: string, value: string) => void
  getPreviewValues: () => Record<string, string>

  // Department tab field value operations (real print data)
  setDeptFieldValue: (templateId: string, elementId: string, value: string) => void
  getDeptFieldValues: (templateId: string) => Record<string, string>
  clearDeptFieldValues: (templateId: string) => void

  // Pre-built templates
  importPrebuiltTemplate: (departmentId: string, template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void

  // Helpers
  generateId: () => string
  getSelectedDepartment: () => CustomDepartment | null
  getSelectedTemplate: () => Template | null
  getEditingElements: () => TemplateElement[]
}

const EMPTY_ELEMENTS: TemplateElement[] = []
const EMPTY_PREVIEW_VALUES: Record<string, string> = {}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper: update the elements array of the currently selected template within departments
function updateSelectedTemplateElements(
  state: { departments: CustomDepartment[]; selectedDepartmentId: string | null; selectedTemplateId: string | null },
  updater: (elements: TemplateElement[]) => TemplateElement[]
): { departments: CustomDepartment[] } {
  const { departments, selectedDepartmentId, selectedTemplateId } = state
  if (!selectedDepartmentId || !selectedTemplateId) return { departments }

  return {
    departments: departments.map((d) =>
      d.id === selectedDepartmentId
        ? {
            ...d,
            templates: d.templates.map((t) =>
              t.id === selectedTemplateId
                ? { ...t, elements: updater(t.elements), updatedAt: new Date().toISOString() }
                : t
            ),
          }
        : d
    ),
  }
}

export const useCustomTemplateStore = create<CustomTemplateState>()(
  persist(
    (set, get) => ({
      departments: [],
      selectedDepartmentId: null,
      selectedTemplateId: null,
      previewValues: {},
      deptFieldValues: {},

      // Department operations
      addDepartment: (name) => {
        const id = generateId()
        set((state) => ({
          departments: [
            ...state.departments,
            {
              id,
              name,
              templates: [],
              createdAt: new Date().toISOString(),
            },
          ],
          selectedDepartmentId: id,
          selectedTemplateId: null,
        }))
        return id
      },

      renameDepartment: (id, name) =>
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === id ? { ...d, name } : d
          ),
        })),

      deleteDepartment: (id) =>
        set((state) => ({
          departments: state.departments.filter((d) => d.id !== id),
          selectedDepartmentId: state.selectedDepartmentId === id ? null : state.selectedDepartmentId,
          selectedTemplateId: state.selectedDepartmentId === id ? null : state.selectedTemplateId,
        })),

      selectDepartment: (id) =>
        set((state) => ({
          selectedDepartmentId: id,
          selectedTemplateId: state.selectedDepartmentId === id
            ? state.selectedTemplateId
            : null,
        })),

      // Template operations
      addTemplate: (departmentId, name) => {
        const templateId = generateId()
        const now = new Date().toISOString()
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === departmentId
              ? {
                  ...d,
                  templates: [
                    ...d.templates,
                    {
                      id: templateId,
                      name,
                      elements: [],
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                }
              : d
          ),
          selectedTemplateId: templateId,
        }))
        return templateId
      },

      renameTemplate: (departmentId, templateId, name) =>
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === departmentId
              ? {
                  ...d,
                  templates: d.templates.map((t) =>
                    t.id === templateId ? { ...t, name, updatedAt: new Date().toISOString() } : t
                  ),
                }
              : d
          ),
        })),

      deleteTemplate: (departmentId, templateId) =>
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === departmentId
              ? { ...d, templates: d.templates.filter((t) => t.id !== templateId) }
              : d
          ),
          selectedTemplateId: state.selectedTemplateId === templateId ? null : state.selectedTemplateId,
        })),

      selectTemplate: (departmentId, templateId) => {
        set({
          selectedDepartmentId: departmentId,
          selectedTemplateId: templateId,
        })
      },

      // Element operations — write directly into the selected template
      addElement: (element) =>
        set((state) => updateSelectedTemplateElements(state, (els) => [...els, element])),

      updateElement: (id, updates) =>
        set((state) =>
          updateSelectedTemplateElements(state, (els) =>
            els
              .filter((el) => el != null)
              .map((el) => (el.id === id ? { ...el, ...updates } as TemplateElement : el))
          )
        ),

      deleteElement: (id) =>
        set((state) =>
          updateSelectedTemplateElements(state, (els) =>
            els.filter((el) => el != null && el.id !== id)
          )
        ),

      moveElementUp: (id) =>
        set((state) =>
          updateSelectedTemplateElements(state, (els) => {
            const idx = els.findIndex((el) => el.id === id)
            if (idx <= 0) return els
            const newEls = [...els]
            ;[newEls[idx - 1], newEls[idx]] = [newEls[idx], newEls[idx - 1]]
            return newEls
          })
        ),

      moveElementDown: (id) =>
        set((state) =>
          updateSelectedTemplateElements(state, (els) => {
            const idx = els.findIndex((el) => el.id === id)
            if (idx < 0 || idx >= els.length - 1) return els
            const newEls = [...els]
            ;[newEls[idx], newEls[idx + 1]] = [newEls[idx + 1], newEls[idx]]
            return newEls
          })
        ),

      setElements: (elements) =>
        set((state) => updateSelectedTemplateElements(state, () => elements)),

      updateTemplateSettings: (updates) =>
        set((state) => {
          const { departments, selectedDepartmentId, selectedTemplateId } = state
          if (!selectedDepartmentId || !selectedTemplateId) return state

          return {
            departments: departments.map((d) =>
              d.id === selectedDepartmentId
                ? {
                    ...d,
                    templates: d.templates.map((t) =>
                      t.id === selectedTemplateId
                        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                        : t
                    ),
                  }
                : d
            ),
          }
        }),

      // Preview value operations
      setPreviewValue: (templateId, elementId, value) =>
        set((state) => ({
          previewValues: {
            ...state.previewValues,
            [templateId]: {
              ...(state.previewValues[templateId] || {}),
              [elementId]: value,
            },
          },
        })),

      getPreviewValues: () => {
        const state = get()
        if (!state.selectedTemplateId) return EMPTY_PREVIEW_VALUES
        return state.previewValues[state.selectedTemplateId] || EMPTY_PREVIEW_VALUES
      },

      // Department tab field values (real print data)
      setDeptFieldValue: (templateId, elementId, value) =>
        set((state) => ({
          deptFieldValues: {
            ...state.deptFieldValues,
            [templateId]: {
              ...(state.deptFieldValues[templateId] || {}),
              [elementId]: value,
            },
          },
        })),

      getDeptFieldValues: (templateId) => {
        const state = get()
        return state.deptFieldValues[templateId] || EMPTY_PREVIEW_VALUES
      },

      clearDeptFieldValues: (templateId) =>
        set((state) => ({
          deptFieldValues: {
            ...state.deptFieldValues,
            [templateId]: {},
          },
        })),

      // Pre-built templates
      importPrebuiltTemplate: (departmentId, template) => {
        const templateId = generateId()
        const now = new Date().toISOString()
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === departmentId
              ? {
                  ...d,
                  templates: [
                    ...d.templates,
                    {
                      ...template,
                      id: templateId,
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                }
              : d
          ),
        }))
      },

      // Helpers
      generateId,

      getSelectedDepartment: () => {
        const state = get()
        return state.departments.find((d) => d.id === state.selectedDepartmentId) || null
      },

      getSelectedTemplate: () => {
        const state = get()
        const dept = state.departments.find((d) => d.id === state.selectedDepartmentId)
        return dept?.templates.find((t) => t.id === state.selectedTemplateId) || null
      },

      getEditingElements: () => {
        const state = get()
        const dept = state.departments.find((d) => d.id === state.selectedDepartmentId)
        const tpl = dept?.templates.find((t) => t.id === state.selectedTemplateId)
        return tpl?.elements ?? EMPTY_ELEMENTS
      },
    }),
    {
      name: 'label-studio-custom-departments',
      version: 3,
      partialize: (state) => ({
        departments: state.departments,
        selectedDepartmentId: state.selectedDepartmentId,
        selectedTemplateId: state.selectedTemplateId,
        previewValues: state.previewValues,
        deptFieldValues: state.deptFieldValues,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v2 adds posX/posY/freeRotation/absScale/flipH/flipV/zIndex to elements
          return state
        }
        if (version < 3) {
          // v3: removed editingElements, now persist selectedDepartmentId/selectedTemplateId
          // If they were previously not persisted, they default to null which is fine
          if (!state.selectedDepartmentId) state.selectedDepartmentId = null
          if (!state.selectedTemplateId) state.selectedTemplateId = null
        }
        return state
      },
    }
  )
)

// Factory functions for creating elements
export function createTextBlockElement(label = 'Text Field'): TextBlockElement {
  return {
    id: generateId(),
    type: 'text-block',
    rotation: 0,
    label,
    placeholder: 'Enter text...',
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'left',
  }
}

export function createBarcodeElement(label = 'Barcode Data'): BarcodeTemplateElement {
  // Get default barcode type from settings
  const defaultBarcodeType = useSettingsStore.getState().labelDefaults.defaultBarcodeType
  return {
    id: generateId(),
    type: 'barcode',
    rotation: 0,
    label,
    barcodeType: defaultBarcodeType,
    showText: true,
    // QR style defaults
    qrDotsStyle: 'square',
    qrCornersStyle: 'square',
    qrCornersShape: 'square',
  }
}

export function createStaticTextElement(content = 'Static Text'): StaticTextElement {
  return {
    id: generateId(),
    type: 'static-text',
    rotation: 0,
    content,
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'left',
  }
}

export function createDividerElement(): DividerElement {
  return {
    id: generateId(),
    type: 'divider',
    rotation: 0,
    style: 'solid',
    thickness: 1,
  }
}

export function createHeaderElement(content = 'Header'): HeaderElement {
  return {
    id: generateId(),
    type: 'header',
    rotation: 0,
    content,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textColor: '#ffffff',
    backgroundColor: '#2563eb',
    backgroundOpacity: 100,
    barHeight: 8,
  }
}

export function createFooterElement(content = 'Footer'): FooterElement {
  return {
    id: generateId(),
    type: 'footer',
    rotation: 0,
    content,
    fontSize: 10,
    fontWeight: 'normal',
    textAlign: 'center',
    textColor: '#ffffff',
    backgroundColor: '#1e293b',
    backgroundOpacity: 100,
    barHeight: 8,
  }
}

export function createShapeElement(shapeType: ShapeType = 'rectangle'): ShapeElement {
  // Line shapes have fixed height based on stroke width
  const isLine = shapeType.startsWith('line-')
  return {
    id: generateId(),
    type: 'shape',
    rotation: 0,
    shapeType,
    // Default position: centered (will be adjusted by caller or auto-layout)
    posX: 13, // Center of 36mm width: (36 - 10) / 2 = 13
    posY: 38, // Center of 86mm height: (86 - 10) / 2 = 38
    width: 10,
    height: isLine ? 2 : 10,
    // Fill
    fillColor: '#000000',
    fillOpacity: 100,
    fillStyle: isLine ? 'none' : 'filled',
    // Stroke
    strokeColor: '#000000',
    strokeWidth: 2,
    strokeStyle: 'solid',
    // Aspect ratio
    lockAspectRatio: shapeType === 'oval' || shapeType === 'star' || shapeType === 'heart',
  }
}

export function createTableElement(columns = 2, rows = 2): TableElement {
  // Create default cells for the table
  const cells: TableCell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      cells.push({
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

  const rowHeight = 6 // mm per row
  const totalHeight = rows * rowHeight

  return {
    id: generateId(),
    type: 'table',
    rotation: 0,
    // Position at top-left with some margin
    posX: 1,
    posY: 10,
    // Width fills label (36mm - 2mm margin)
    width: 34,
    height: totalHeight,
    // Structure
    columns,
    rows,
    cells,
    // Border styling
    borderColor: '#000000',
    borderWidth: 1,
    borderStyle: 'solid',
    // Header row
    hasHeaderRow: true,
    headerBgColor: '#e5e7eb',
    // Cell styling
    cellPadding: 2,
    rowHeight,
    // Alternating rows
    alternatingRows: false,
    alternatingColor: '#f9fafb',
    // Lock width
    lockWidthToLabel: true,
  }
}
