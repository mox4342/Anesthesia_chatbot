export interface AnesthesiaQuery {
  question: string
  context?: {
    patientAge?: string
    procedure?: string
    comorbidities?: string[]
  }
  urgency: 'routine' | 'urgent' | 'emergency'
}

export interface AnesthesiaResponse {
  answer: string
  evidenceLevel: 'I' | 'II' | 'III' | 'IV' | 'V' | 'Expert Opinion'
  citations: Citation[]
  relatedProtocols: Protocol[]
  calculators?: Calculator[]
}

export interface Citation {
  title: string
  authors: string[]
  journal: string
  year: string
  pmid?: string
  url: string
}

export interface Protocol {
  id: string
  title: string
  priority: 'critical' | 'urgent' | 'important'
  lastUpdated: Date
  steps: ProtocolStep[]
  medications: MedicationDose[]
  references: string[]
}

export interface ProtocolStep {
  order: number
  action: string
  critical: boolean
  notes?: string
}

export interface MedicationDose {
  name: string
  dose: string
  route: string
  frequency?: string
  maxDose?: string
  contraindications?: string[]
}

export interface Calculator {
  id: string
  name: string
  category: 'dosing' | 'fluid' | 'pediatric' | 'conversion'
  inputs: CalculatorInput[]
  calculate: (inputs: Record<string, any>) => CalculatorResult
}

export interface CalculatorInput {
  name: string
  label: string
  type: 'number' | 'select' | 'checkbox'
  unit?: string
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  required: boolean
}

export interface CalculatorResult {
  value: number
  unit: string
  formula?: string
  warnings?: string[]
  references?: string[]
}

export interface DrugInfo {
  name: string
  genericName: string
  brandNames: string[]
  class: string
  mechanism: string
  indications: string[]
  contraindications: string[]
  sideEffects: string[]
  dosing: {
    adult: string
    pediatric?: string
    renal?: string
    hepatic?: string
  }
  interactions: string[]
}

export interface PatientContext {
  age?: number
  weight?: number
  height?: number
  sex?: 'M' | 'F'
  asaClass?: 1 | 2 | 3 | 4 | 5
  allergies?: string[]
  medications?: string[]
  comorbidities?: string[]
}