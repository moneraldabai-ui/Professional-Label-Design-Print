import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  TemplateElement,
  TextBlockElement,
  BarcodeTemplateElement,
  StaticTextElement,
  DividerElement,
  Template,
} from './useCustomTemplateStore'

// Fixed department IDs
export type FixedDepartmentId = 'it' | 'hr' | 'warehouse' | 'security' | 'assets'

interface FixedDepartmentData {
  templates: Template[]
  selectedTemplateId: string | null
}

// Default display names for fixed departments
const DEFAULT_DEPARTMENT_NAMES: Record<FixedDepartmentId, string> = {
  it: 'IT',
  hr: 'HR',
  warehouse: 'Warehouse',
  security: 'Security',
  assets: 'Assets',
}

interface FixedDepartmentState {
  departments: Record<FixedDepartmentId, FixedDepartmentData>

  // Track which fixed departments have been deleted
  deletedDepartments: FixedDepartmentId[]

  // Custom display names for fixed departments (overrides defaults)
  departmentNames: Record<FixedDepartmentId, string>

  // Preview field values per template (keyed by templateId -> elementId -> value)
  previewValues: Record<string, Record<string, string>>

  // Department operations
  deleteDepartment: (departmentId: FixedDepartmentId) => void
  getExistingDepartmentIds: () => FixedDepartmentId[]

  // Template operations
  addTemplate: (departmentId: FixedDepartmentId, name: string) => string
  renameTemplate: (departmentId: FixedDepartmentId, templateId: string, name: string) => void
  deleteTemplate: (departmentId: FixedDepartmentId, templateId: string) => void
  selectTemplate: (departmentId: FixedDepartmentId, templateId: string) => void

  // Element operations
  addElement: (departmentId: FixedDepartmentId, templateId: string, element: TemplateElement) => void
  updateElement: (departmentId: FixedDepartmentId, templateId: string, elementId: string, updates: Partial<TemplateElement>) => void
  deleteElement: (departmentId: FixedDepartmentId, templateId: string, elementId: string) => void
  moveElementUp: (departmentId: FixedDepartmentId, templateId: string, elementId: string) => void
  moveElementDown: (departmentId: FixedDepartmentId, templateId: string, elementId: string) => void
  setElements: (departmentId: FixedDepartmentId, templateId: string, elements: TemplateElement[]) => void

  // Template settings (background color, etc.)
  updateTemplateSettings: (departmentId: FixedDepartmentId, templateId: string, updates: { backgroundColor?: string; backgroundOpacity?: number }) => void

  // Preview values
  setPreviewValue: (templateId: string, elementId: string, value: string) => void
  getPreviewValues: (templateId: string) => Record<string, string>

  // Pre-built templates
  importPrebuiltTemplate: (departmentId: FixedDepartmentId, template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void

  // Department rename
  renameDepartment: (departmentId: FixedDepartmentId, name: string) => void
  getDepartmentName: (departmentId: FixedDepartmentId) => string

  // Helpers
  getTemplates: (departmentId: FixedDepartmentId) => Template[]
  getSelectedTemplateId: (departmentId: FixedDepartmentId) => string | null
  getSelectedTemplate: (departmentId: FixedDepartmentId) => Template | null
  getElements: (departmentId: FixedDepartmentId, templateId: string) => TemplateElement[]
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const EMPTY_ELEMENTS: TemplateElement[] = []
const EMPTY_PREVIEW_VALUES: Record<string, string> = {}

// Helper to create text block element
function createTextBlock(label: string, placeholder: string, fontSize = 12, fontWeight: 'normal' | 'bold' = 'normal'): TextBlockElement {
  return {
    id: generateId(),
    type: 'text-block',
    rotation: 0,
    label,
    placeholder,
    fontSize,
    fontWeight,
    textAlign: 'left',
  }
}

// Helper to create barcode element
function createBarcode(label: string, barcodeType: 'code128' | 'code39' | 'qrcode' | 'datamatrix' | 'pdf417' = 'code128', showText = true): BarcodeTemplateElement {
  return {
    id: generateId(),
    type: 'barcode',
    rotation: 0,
    label,
    barcodeType,
    showText,
  }
}

// Helper to create static text element
function createStatic(content: string, fontSize = 12, fontWeight: 'normal' | 'bold' = 'normal'): StaticTextElement {
  return {
    id: generateId(),
    type: 'static-text',
    rotation: 0,
    content,
    fontSize,
    fontWeight,
    textAlign: 'left',
  }
}

// Helper to create divider element
function createDivider(style: 'solid' | 'dashed' | 'dotted' = 'solid', thickness = 1): DividerElement {
  return {
    id: generateId(),
    type: 'divider',
    rotation: 0,
    style,
    thickness,
  }
}

// Default templates for each department
function createDefaultTemplates(): Record<FixedDepartmentId, FixedDepartmentData> {
  const now = new Date().toISOString()

  // IT Department Templates
  const itTemplates: Template[] = [
    {
      id: 'it-windows-login',
      name: 'Windows Login Card',
      elements: [
        createStatic('WINDOWS LOGIN CREDENTIALS', 14, 'bold'),
        createDivider('solid', 1),
        createTextBlock('Employee Name', 'John Smith', 12, 'bold'),
        createTextBlock('Username', 'john.smith', 12, 'normal'),
        createTextBlock('Password', '********', 12, 'normal'),
        createTextBlock('Department', 'Information Technology', 10, 'normal'),
        createDivider('dashed', 1),
        createBarcode('Username Barcode', 'code128', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'it-workstation-asset',
      name: 'Workstation Asset Tag',
      elements: [
        createStatic('WORKSTATION', 14, 'bold'),
        createTextBlock('PC Name', 'PC-IT-001', 14, 'bold'),
        createTextBlock('Serial Number', 'SN-ABC123456', 10, 'normal'),
        createDivider('solid', 1),
        createTextBlock('Assigned To', 'John Smith', 12, 'normal'),
        createTextBlock('Location', 'Building A, Room 101', 10, 'normal'),
        createBarcode('PC Name Barcode', 'code128', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // HR Department Templates
  const hrTemplates: Template[] = [
    {
      id: 'hr-employee-id',
      name: 'Employee ID Label',
      elements: [
        createTextBlock('Full Name', 'John Smith', 14, 'bold'),
        createTextBlock('Job Title', 'Software Engineer', 12, 'normal'),
        createTextBlock('Department', 'Engineering', 10, 'normal'),
        createDivider('solid', 1),
        createTextBlock('Employee ID', 'EMP001', 12, 'bold'),
        createBarcode('Employee ID Barcode', 'code39', true),
        createBarcode('Portal QR Code', 'qrcode', false),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'hr-visitor-pass',
      name: 'Visitor Pass',
      elements: [
        createStatic('VISITOR', 18, 'bold'),
        createDivider('solid', 2),
        createTextBlock('Visitor Name', 'Jane Doe', 14, 'bold'),
        createTextBlock('Host', 'John Smith', 12, 'normal'),
        createTextBlock('Visit Date', '2024-01-15', 10, 'normal'),
        createTextBlock('Purpose', 'Interview', 10, 'normal'),
        createBarcode('Visitor QR', 'qrcode', false),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Warehouse Department Templates
  const warehouseTemplates: Template[] = [
    {
      id: 'warehouse-product-sku',
      name: 'Product SKU Label',
      elements: [
        createTextBlock('Product Name', 'Widget Pro 3000', 12, 'bold'),
        createTextBlock('SKU', 'WGT-PRO-3K', 14, 'bold'),
        createDivider('solid', 1),
        createTextBlock('Bin Location', 'A-12-3', 12, 'normal'),
        createTextBlock('Quantity', '100', 12, 'normal'),
        createTextBlock('Unit', 'pcs', 10, 'normal'),
        createTextBlock('Batch Number', 'LOT-2024-0415', 10, 'normal'),
        createBarcode('SKU Barcode', 'code128', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'warehouse-shipping',
      name: 'Shipping Label',
      elements: [
        createStatic('SHIP TO:', 10, 'bold'),
        createTextBlock('Recipient Name', 'John Smith', 14, 'bold'),
        createTextBlock('Address Line 1', '123 Main Street', 12, 'normal'),
        createTextBlock('Address Line 2', 'Suite 100', 10, 'normal'),
        createTextBlock('City, State ZIP', 'New York, NY 10001', 12, 'normal'),
        createDivider('solid', 2),
        createTextBlock('Tracking Number', '1Z999AA10123456784', 10, 'bold'),
        createBarcode('Tracking Barcode', 'code128', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Security Department Templates
  const securityTemplates: Template[] = [
    {
      id: 'security-access-card',
      name: 'Access Card',
      elements: [
        createStatic('ACCESS BADGE', 14, 'bold'),
        createDivider('solid', 2),
        createTextBlock('Employee Name', 'John Smith', 14, 'bold'),
        createTextBlock('Clearance Level', 'HIGH', 12, 'bold'),
        createTextBlock('Access Zone', 'Building A - Floor 3', 10, 'normal'),
        createDivider('dashed', 1),
        createTextBlock('Valid From', '2024-01-01', 10, 'normal'),
        createTextBlock('Valid Until', '2024-12-31', 10, 'normal'),
        createBarcode('Access Barcode', 'code128', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'security-locker',
      name: 'Locker Label',
      elements: [
        createStatic('LOCKER', 12, 'bold'),
        createTextBlock('Locker Number', '42', 24, 'bold'),
        createDivider('solid', 1),
        createTextBlock('Assigned To', 'John Smith', 12, 'normal'),
        createTextBlock('Combination', '12-34-56', 10, 'normal'),
        createBarcode('Locker Barcode', 'code39', true),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Assets Department Templates
  const assetsTemplates: Template[] = [
    {
      id: 'assets-asset-tag',
      name: 'Asset Tag',
      elements: [
        createStatic('COMPANY ASSET', 10, 'bold'),
        createTextBlock('Asset ID', 'AST-2024-00001', 14, 'bold'),
        createTextBlock('Category', 'Laptop', 12, 'normal'),
        createDivider('solid', 1),
        createTextBlock('Purchase Date', '2024-01-15', 10, 'normal'),
        createTextBlock('Warranty Until', '2027-01-15', 10, 'normal'),
        createTextBlock('Location', 'Building A - Room 201', 10, 'normal'),
        createTextBlock('Assigned To', 'John Smith', 10, 'normal'),
        createBarcode('Asset Barcode', 'datamatrix', false),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'assets-cable-tag',
      name: 'Cable Tag',
      elements: [
        createTextBlock('Cable ID', 'CBL-001', 12, 'bold'),
        createTextBlock('Cable Type', 'Ethernet', 10, 'normal'),
        createDivider('dashed', 1),
        createStatic('FROM:', 8, 'bold'),
        createTextBlock('Source', 'Patch Panel A - Port 12', 10, 'normal'),
        createStatic('TO:', 8, 'bold'),
        createTextBlock('Destination', 'Switch 1 - Port 24', 10, 'normal'),
        createBarcode('Cable Barcode', 'datamatrix', false),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  return {
    it: {
      templates: itTemplates,
      selectedTemplateId: itTemplates[0].id,
    },
    hr: {
      templates: hrTemplates,
      selectedTemplateId: hrTemplates[0].id,
    },
    warehouse: {
      templates: warehouseTemplates,
      selectedTemplateId: warehouseTemplates[0].id,
    },
    security: {
      templates: securityTemplates,
      selectedTemplateId: securityTemplates[0].id,
    },
    assets: {
      templates: assetsTemplates,
      selectedTemplateId: assetsTemplates[0].id,
    },
  }
}

// Helper to update elements in a specific template
function updateTemplateElements(
  departments: Record<FixedDepartmentId, FixedDepartmentData>,
  departmentId: FixedDepartmentId,
  templateId: string,
  updater: (elements: TemplateElement[]) => TemplateElement[]
): Record<FixedDepartmentId, FixedDepartmentData> {
  const dept = departments[departmentId]
  return {
    ...departments,
    [departmentId]: {
      ...dept,
      templates: dept.templates.map((t) =>
        t.id === templateId
          ? { ...t, elements: updater(t.elements), updatedAt: new Date().toISOString() }
          : t
      ),
    },
  }
}

export const useFixedDepartmentStore = create<FixedDepartmentState>()(
  persist(
    (set, get) => ({
      departments: createDefaultTemplates(),
      deletedDepartments: [],
      departmentNames: { ...DEFAULT_DEPARTMENT_NAMES },
      previewValues: {},

      // Department delete
      deleteDepartment: (departmentId) =>
        set((state) => ({
          deletedDepartments: [...state.deletedDepartments, departmentId],
        })),

      getExistingDepartmentIds: () => {
        const state = get()
        const allIds: FixedDepartmentId[] = ['it', 'hr', 'warehouse', 'security', 'assets']
        return allIds.filter((id) => !state.deletedDepartments.includes(id))
      },

      // Department rename
      renameDepartment: (departmentId, name) =>
        set((state) => ({
          departmentNames: {
            ...state.departmentNames,
            [departmentId]: name,
          },
        })),

      getDepartmentName: (departmentId) => {
        const state = get()
        return state.departmentNames[departmentId] || DEFAULT_DEPARTMENT_NAMES[departmentId]
      },

      // Template operations
      addTemplate: (departmentId, name) => {
        const templateId = generateId()
        const now = new Date().toISOString()
        set((state) => ({
          departments: {
            ...state.departments,
            [departmentId]: {
              ...state.departments[departmentId],
              templates: [
                ...state.departments[departmentId].templates,
                {
                  id: templateId,
                  name,
                  elements: [],
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              selectedTemplateId: templateId,
            },
          },
        }))
        return templateId
      },

      renameTemplate: (departmentId, templateId, name) =>
        set((state) => ({
          departments: {
            ...state.departments,
            [departmentId]: {
              ...state.departments[departmentId],
              templates: state.departments[departmentId].templates.map((t) =>
                t.id === templateId ? { ...t, name, updatedAt: new Date().toISOString() } : t
              ),
            },
          },
        })),

      deleteTemplate: (departmentId, templateId) =>
        set((state) => {
          const dept = state.departments[departmentId]
          const newTemplates = dept.templates.filter((t) => t.id !== templateId)
          return {
            departments: {
              ...state.departments,
              [departmentId]: {
                templates: newTemplates,
                selectedTemplateId:
                  dept.selectedTemplateId === templateId
                    ? newTemplates[0]?.id || null
                    : dept.selectedTemplateId,
              },
            },
          }
        }),

      selectTemplate: (departmentId, templateId) =>
        set((state) => ({
          departments: {
            ...state.departments,
            [departmentId]: {
              ...state.departments[departmentId],
              selectedTemplateId: templateId,
            },
          },
        })),

      // Element operations
      addElement: (departmentId, templateId, element) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            (els) => [...els, element]
          ),
        })),

      updateElement: (departmentId, templateId, elementId, updates) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            (els) =>
              els.map((el) =>
                el.id === elementId ? ({ ...el, ...updates } as TemplateElement) : el
              )
          ),
        })),

      deleteElement: (departmentId, templateId, elementId) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            (els) => els.filter((el) => el.id !== elementId)
          ),
        })),

      moveElementUp: (departmentId, templateId, elementId) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            (els) => {
              const idx = els.findIndex((el) => el.id === elementId)
              if (idx <= 0) return els
              const newEls = [...els]
              ;[newEls[idx - 1], newEls[idx]] = [newEls[idx], newEls[idx - 1]]
              return newEls
            }
          ),
        })),

      moveElementDown: (departmentId, templateId, elementId) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            (els) => {
              const idx = els.findIndex((el) => el.id === elementId)
              if (idx < 0 || idx >= els.length - 1) return els
              const newEls = [...els]
              ;[newEls[idx], newEls[idx + 1]] = [newEls[idx + 1], newEls[idx]]
              return newEls
            }
          ),
        })),

      setElements: (departmentId, templateId, elements) =>
        set((state) => ({
          departments: updateTemplateElements(
            state.departments,
            departmentId,
            templateId,
            () => elements
          ),
        })),

      updateTemplateSettings: (departmentId, templateId, updates) =>
        set((state) => ({
          departments: {
            ...state.departments,
            [departmentId]: {
              ...state.departments[departmentId],
              templates: state.departments[departmentId].templates.map((t) =>
                t.id === templateId
                  ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                  : t
              ),
            },
          },
        })),

      // Preview values
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

      getPreviewValues: (templateId) => {
        const state = get()
        return state.previewValues[templateId] || EMPTY_PREVIEW_VALUES
      },

      // Pre-built templates
      importPrebuiltTemplate: (departmentId, template) => {
        const templateId = generateId()
        const now = new Date().toISOString()
        set((state) => ({
          departments: {
            ...state.departments,
            [departmentId]: {
              ...state.departments[departmentId],
              templates: [
                ...state.departments[departmentId].templates,
                {
                  ...template,
                  id: templateId,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            },
          },
        }))
      },

      // Helpers
      getTemplates: (departmentId) => {
        const state = get()
        return state.departments[departmentId]?.templates ?? []
      },

      getSelectedTemplateId: (departmentId) => {
        const state = get()
        return state.departments[departmentId]?.selectedTemplateId ?? null
      },

      getSelectedTemplate: (departmentId) => {
        const state = get()
        const dept = state.departments[departmentId]
        if (!dept) return null
        return dept.templates.find((t) => t.id === dept.selectedTemplateId) || null
      },

      getElements: (departmentId, templateId) => {
        const state = get()
        const dept = state.departments[departmentId]
        if (!dept) return EMPTY_ELEMENTS
        const template = dept.templates.find((t) => t.id === templateId)
        return template?.elements ?? EMPTY_ELEMENTS
      },
    }),
    {
      name: 'label-studio-fixed-departments',
      version: 3,
      partialize: (state) => ({
        departments: state.departments,
        deletedDepartments: state.deletedDepartments,
        departmentNames: state.departmentNames,
        previewValues: state.previewValues,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v2: add departmentNames with defaults
          if (!state.departmentNames) {
            state.departmentNames = { ...DEFAULT_DEPARTMENT_NAMES }
          }
        }
        if (version < 3) {
          // v3: add deletedDepartments array
          if (!state.deletedDepartments) {
            state.deletedDepartments = []
          }
        }
        return state
      },
    }
  )
)
