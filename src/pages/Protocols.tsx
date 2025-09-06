import React, { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import MedicalDisclaimer from '../components/common/MedicalDisclaimer'

interface Protocol {
  id: string
  title: string
  priority: 'critical' | 'urgent' | 'important'
  lastUpdated: string
  steps: string[]
  medications: Array<{ name: string; dose: string }>
  references: string[]
}

const protocols: Protocol[] = [
  {
    id: 'malignant-hyperthermia',
    title: 'Malignant Hyperthermia',
    priority: 'critical',
    lastUpdated: '2024-01-15',
    steps: [
      'STOP all volatile anesthetics and succinylcholine immediately',
      'Hyperventilate with 100% oxygen at flows of 10 L/min or more',
      'Administer dantrolene 2.5 mg/kg IV bolus rapidly',
      'Continue dantrolene up to 10 mg/kg or more until signs resolve',
      'Cool patient: ice packs, cold IV fluids, cooling blankets',
      'Treat hyperkalemia with calcium, insulin/glucose, bicarbonate',
      'Monitor: Core temp, ETCO2, ABG, electrolytes, CK, urine output',
      'Call MH Hotline: 1-800-644-9737 (US)'
    ],
    medications: [
      { name: 'Dantrolene', dose: '2.5 mg/kg initial, up to 10+ mg/kg total' },
      { name: 'Calcium chloride', dose: '10 mg/kg for hyperkalemia' },
      { name: 'Regular insulin', dose: '10 units IV with 50 mL D50' },
      { name: 'Sodium bicarbonate', dose: '1-2 mEq/kg for acidosis' }
    ],
    references: [
      'MHAUS Guidelines 2024',
      'ASA Practice Advisory on MH'
    ]
  },
  {
    id: 'local-anesthetic-toxicity',
    title: 'Local Anesthetic Systemic Toxicity (LAST)',
    priority: 'critical',
    lastUpdated: '2024-01-10',
    steps: [
      'STOP injection of local anesthetic immediately',
      'Call for help and lipid emulsion (Intralipid 20%)',
      'Maintain airway, give 100% oxygen',
      'Confirm IV access, start basic resuscitation',
      'Give lipid emulsion 20% bolus: 1.5 mL/kg over 1 minute',
      'Start lipid infusion: 0.25 mL/kg/min',
      'Repeat bolus every 3-5 min for cardiovascular collapse (max 3 doses)',
      'Continue infusion for at least 10 min after circulation restored',
      'Avoid vasopressin, calcium channel blockers, beta blockers, lidocaine'
    ],
    medications: [
      { name: 'Lipid emulsion 20%', dose: '1.5 mL/kg bolus, then 0.25 mL/kg/min' },
      { name: 'Epinephrine', dose: '<1 mcg/kg for arrest' },
      { name: 'Avoid', dose: 'Vasopressin, CCBs, beta-blockers' }
    ],
    references: [
      'ASRA LAST Checklist 2024',
      'Neal et al. Regional Anesthesia Guidelines'
    ]
  },
  {
    id: 'anaphylaxis',
    title: 'Anaphylaxis',
    priority: 'critical',
    lastUpdated: '2024-01-20',
    steps: [
      'STOP suspected triggering agent',
      'Call for help',
      'Administer epinephrine IM 0.3-0.5 mg (1:1000) or IV 50-100 mcg (1:10,000)',
      'Give 100% oxygen, secure airway if needed',
      'Aggressive fluid resuscitation with crystalloid',
      'Repeat epinephrine every 5-15 minutes as needed',
      'Consider H1 blocker (diphenhydramine 25-50 mg IV)',
      'Consider H2 blocker (ranitidine 50 mg IV)',
      'Consider corticosteroids (methylprednisolone 125 mg IV)',
      'Monitor for biphasic reaction for 24 hours'
    ],
    medications: [
      { name: 'Epinephrine', dose: 'IM: 0.3-0.5 mg (1:1000) or IV: 50-100 mcg (1:10,000)' },
      { name: 'Diphenhydramine', dose: '25-50 mg IV' },
      { name: 'Methylprednisolone', dose: '125 mg IV' },
      { name: 'Crystalloid', dose: '20-30 mL/kg boluses' }
    ],
    references: [
      'WAO Anaphylaxis Guidelines 2024',
      'ASA Algorithm for Anaphylaxis'
    ]
  }
]

const Protocols: React.FC = () => {
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handlePrint = (protocol: Protocol) => {
    window.print()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Protocols</h1>
        <p className="text-gray-600">Quick access to critical anesthesia emergency procedures</p>
      </div>

      <div className="space-y-4">
        {protocols.map((protocol) => (
          <div key={protocol.id} className="card">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedProtocol(
                expandedProtocol === protocol.id ? null : protocol.id
              )}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={24} />
                <div>
                  <h2 className="text-xl font-semibold">{protocol.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(protocol.priority)}`}>
                      {protocol.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Updated: {protocol.lastUpdated}
                    </span>
                  </div>
                </div>
              </div>
              {expandedProtocol === protocol.id ? (
                <ChevronUp size={24} />
              ) : (
                <ChevronDown size={24} />
              )}
            </div>

            {expandedProtocol === protocol.id && (
              <div className="mt-6 space-y-4 print:block">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-600">Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {protocol.steps.map((step, index) => (
                      <li key={index} className="text-gray-700">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 text-blue-600">Medications:</h3>
                  <div className="space-y-2">
                    {protocol.medications.map((med, index) => (
                      <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="font-medium">{med.name}:</span>
                        <span className="text-gray-700">{med.dose}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">References:</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {protocol.references.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePrint(protocol)}
                  className="btn-secondary flex items-center gap-2 print:hidden"
                >
                  <Printer size={20} />
                  Print Protocol
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">Offline Access Available</h3>
            <p className="text-sm text-blue-700 mt-1">
              These protocols are stored locally for offline access. 
              They will remain available even without an internet connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Protocols