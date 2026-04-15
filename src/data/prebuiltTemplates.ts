import {
  TemplateElement,
  TextBlockElement,
  BarcodeTemplateElement,
  StaticTextElement,
  DividerElement,
} from '../store/useCustomTemplateStore'

// Helper to create IDs for pre-built templates
let idCounter = 0
const makeId = () => `prebuilt-${++idCounter}`

// Type-safe element creators
function textBlock(label: string, options: Partial<Omit<TextBlockElement, 'id' | 'type' | 'label'>> = {}): TextBlockElement {
  return {
    id: makeId(),
    type: 'text-block',
    rotation: options.rotation || 0,
    label,
    placeholder: options.placeholder || `Enter ${label.toLowerCase()}...`,
    fontSize: options.fontSize || 12,
    fontWeight: options.fontWeight || 'normal',
    textAlign: options.textAlign || 'left',
  }
}

function barcode(label: string, options: Partial<Omit<BarcodeTemplateElement, 'id' | 'type' | 'label'>> = {}): BarcodeTemplateElement {
  return {
    id: makeId(),
    type: 'barcode',
    rotation: options.rotation || 0,
    label,
    barcodeType: options.barcodeType || 'code128',
    showText: options.showText ?? true,
  }
}

function staticText(content: string, options: Partial<Omit<StaticTextElement, 'id' | 'type' | 'content'>> = {}): StaticTextElement {
  return {
    id: makeId(),
    type: 'static-text',
    rotation: options.rotation || 0,
    content,
    fontSize: options.fontSize || 12,
    fontWeight: options.fontWeight || 'normal',
    textAlign: options.textAlign || 'left',
  }
}

function divider(options: Partial<Omit<DividerElement, 'id' | 'type'>> = {}): DividerElement {
  return {
    id: makeId(),
    type: 'divider',
    rotation: options.rotation || 0,
    style: options.style || 'solid',
    thickness: options.thickness || 1,
  }
}

export interface PrebuiltTemplate {
  name: string
  description: string
  category: string
  elements: TemplateElement[]
}

export const prebuiltTemplates: PrebuiltTemplate[] = [
  // 1. Price Tag
  {
    name: 'Price Tag',
    description: 'Product pricing label with barcode and price display',
    category: 'Retail',
    elements: [
      textBlock('Product Name', { fontSize: 14, fontWeight: 'bold', textAlign: 'center' }),
      staticText('SKU:', { fontSize: 10 }),
      textBlock('SKU Number', { fontSize: 10, placeholder: 'Enter SKU...' }),
      divider(),
      staticText('Price', { fontSize: 10, textAlign: 'center' }),
      textBlock('Price', { fontSize: 18, fontWeight: 'bold', textAlign: 'center', placeholder: '$0.00' }),
      divider(),
      barcode('Product Barcode', { barcodeType: 'code128' }),
    ],
  },

  // 2. Event Badge
  {
    name: 'Event Badge',
    description: 'Name badge for conferences, meetings, and events',
    category: 'Events',
    elements: [
      staticText('VISITOR', { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }),
      divider({ style: 'dashed' }),
      textBlock('Full Name', { fontSize: 16, fontWeight: 'bold', textAlign: 'center', placeholder: 'John Smith' }),
      textBlock('Company', { fontSize: 12, textAlign: 'center', placeholder: 'ACME Corporation' }),
      textBlock('Title', { fontSize: 10, textAlign: 'center', placeholder: 'Software Engineer' }),
      divider(),
      barcode('Badge ID', { barcodeType: 'qrcode', showText: false }),
    ],
  },

  // 3. Medicine Label
  {
    name: 'Medicine Label',
    description: 'Prescription and medication labeling',
    category: 'Healthcare',
    elements: [
      textBlock('Patient Name', { fontSize: 12, fontWeight: 'bold' }),
      textBlock('Date of Birth', { fontSize: 10, placeholder: 'MM/DD/YYYY' }),
      divider(),
      textBlock('Medication Name', { fontSize: 14, fontWeight: 'bold' }),
      textBlock('Dosage', { fontSize: 12, placeholder: 'e.g., 500mg' }),
      textBlock('Instructions', { fontSize: 10, placeholder: 'Take with food...' }),
      divider({ style: 'dashed' }),
      staticText('Rx #:', { fontSize: 10 }),
      barcode('Prescription Number', { barcodeType: 'code128' }),
    ],
  },

  // 4. Book Label
  {
    name: 'Book Label',
    description: 'Library book identification and tracking label',
    category: 'Library',
    elements: [
      staticText('LIBRARY', { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }),
      divider(),
      textBlock('Book Title', { fontSize: 12, fontWeight: 'bold' }),
      textBlock('Author', { fontSize: 10 }),
      textBlock('Call Number', { fontSize: 10, fontWeight: 'bold', placeholder: '813.54 SMI' }),
      divider(),
      barcode('ISBN', { barcodeType: 'code128' }),
    ],
  },

  // 5. Tool Tag
  {
    name: 'Tool Tag',
    description: 'Equipment and tool identification tag',
    category: 'Maintenance',
    elements: [
      staticText('EQUIPMENT TAG', { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }),
      divider(),
      textBlock('Tool Name', { fontSize: 14, fontWeight: 'bold' }),
      textBlock('Asset Number', { fontSize: 10, placeholder: 'TL-00001' }),
      textBlock('Location', { fontSize: 10, placeholder: 'Workshop A' }),
      divider({ style: 'dashed' }),
      staticText('Last Calibration:', { fontSize: 8 }),
      textBlock('Calibration Date', { fontSize: 8, placeholder: 'MM/DD/YYYY' }),
      barcode('Tool ID', { barcodeType: 'code39' }),
    ],
  },

  // 6. Meeting Room
  {
    name: 'Meeting Room',
    description: 'Room identification and capacity label',
    category: 'Facilities',
    elements: [
      textBlock('Room Name', { fontSize: 18, fontWeight: 'bold', textAlign: 'center', placeholder: 'Conference Room A' }),
      divider(),
      staticText('Capacity:', { fontSize: 10, textAlign: 'center' }),
      textBlock('Max Occupancy', { fontSize: 14, textAlign: 'center', placeholder: '12 persons' }),
      divider({ style: 'dashed' }),
      textBlock('Floor / Building', { fontSize: 10, textAlign: 'center', placeholder: '3rd Floor, Building A' }),
      barcode('Room Code', { barcodeType: 'qrcode', showText: false }),
    ],
  },

  // 7. Server Rack
  {
    name: 'Server Rack',
    description: 'Data center server and rack identification',
    category: 'IT Infrastructure',
    elements: [
      staticText('SERVER', { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }),
      textBlock('Hostname', { fontSize: 14, fontWeight: 'bold', textAlign: 'center', placeholder: 'srv-prod-01' }),
      divider(),
      staticText('IP:', { fontSize: 9 }),
      textBlock('IP Address', { fontSize: 10, placeholder: '192.168.1.100' }),
      staticText('Rack:', { fontSize: 9 }),
      textBlock('Rack Location', { fontSize: 10, placeholder: 'R1-U24' }),
      divider({ style: 'dashed' }),
      textBlock('Service', { fontSize: 9, placeholder: 'Web Server' }),
      barcode('Asset Tag', { barcodeType: 'datamatrix', showText: false }),
    ],
  },

  // 8. Return Label
  {
    name: 'Return Label',
    description: 'Package return and shipping label',
    category: 'Shipping',
    elements: [
      staticText('RETURN TO SENDER', { fontSize: 12, fontWeight: 'bold', textAlign: 'center' }),
      divider(),
      staticText('From:', { fontSize: 9, fontWeight: 'bold' }),
      textBlock('Sender Name', { fontSize: 10 }),
      textBlock('Sender Address', { fontSize: 9, placeholder: '123 Main St, City, ST 12345' }),
      divider({ style: 'dashed' }),
      staticText('To:', { fontSize: 9, fontWeight: 'bold' }),
      textBlock('Recipient Name', { fontSize: 10 }),
      textBlock('Recipient Address', { fontSize: 9, placeholder: '456 Oak Ave, Town, ST 67890' }),
      divider(),
      barcode('Tracking Number', { barcodeType: 'code128' }),
    ],
  },
]

// Group templates by category for easier browsing
export function getTemplatesByCategory(): Record<string, PrebuiltTemplate[]> {
  return prebuiltTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, PrebuiltTemplate[]>)
}
