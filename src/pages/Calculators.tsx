import React, { useState } from 'react'
import MedicalDisclaimer from '../components/common/MedicalDisclaimer'
import PediatricCalculator from '../components/DrugCalculator/PediatricCalculator'
import { Calculator, Info, Baby, Users } from 'lucide-react'

const Calculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'adult' | 'pediatric'>('adult')
  const [weight, setWeight] = useState('')
  const [isElderly, setIsElderly] = useState(false)
  const [isRSI, setIsRSI] = useState(false)
  const [drugType, setDrugType] = useState<'lidocaine' | 'bupivacaine'>('lidocaine')
  const [withEpi, setWithEpi] = useState(false)

  // Propofol calculation
  const calculatePropofol = () => {
    if (!weight) return null
    const mgPerKg = isElderly ? 1.0 : 2.0
    const dose = parseFloat(weight) * mgPerKg
    return {
      dose: dose.toFixed(1),
      range: isElderly ? '0.5-1.5 mg/kg' : '1.5-2.5 mg/kg'
    }
  }

  // Rocuronium calculation
  const calculateRocuronium = () => {
    if (!weight) return null
    const mgPerKg = isRSI ? 1.2 : 0.6
    const dose = parseFloat(weight) * mgPerKg
    return {
      dose: dose.toFixed(1),
      indication: isRSI ? 'RSI dose' : 'Standard intubation dose'
    }
  }

  // Local anesthetic maximum
  const calculateLocalAnesthetic = () => {
    if (!weight) return null
    const maxDoses = {
      lidocaine: { without: 4.5, with: 7 },
      bupivacaine: { without: 2, with: 3 }
    }
    const mgPerKg = withEpi 
      ? maxDoses[drugType].with 
      : maxDoses[drugType].without
    const calculatedDose = parseFloat(weight) * mgPerKg
    const maxAbsolute = drugType === 'lidocaine' ? 500 : 175
    const finalDose = Math.min(calculatedDose, maxAbsolute)
    
    return {
      dose: finalDose.toFixed(0),
      maxAbsolute,
      mgPerKg
    }
  }

  const propofolResult = calculatePropofol()
  const rocuroniumResult = calculateRocuronium()
  const localResult = calculateLocalAnesthetic()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <MedicalDisclaimer prominent={true} dismissible={false} position="top" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Drug Calculators</h1>
        <p className="text-gray-600">Calculate weight-based drug dosages for anesthesia</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('adult')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'adult'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Users size={20} />
          Adult Calculators
        </button>
        <button
          onClick={() => setActiveTab('pediatric')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pediatric'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Baby size={20} />
          Pediatric Calculators
        </button>
      </div>

      {/* Adult Calculators Section */}
      {activeTab === 'adult' && (
        <>
          <div className="mb-6 card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Weight (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight in kg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="0.1"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Propofol Calculator */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Propofol Induction</h2>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isElderly}
                onChange={(e) => setIsElderly(e.target.checked)}
                className="rounded"
              />
              <span>Elderly patient (≥65 years)</span>
            </label>
          </div>

          {propofolResult && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {propofolResult.dose} mg
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Dosing range: {propofolResult.range}
              </div>
              <div className="mt-2 flex items-start gap-1">
                <Info size={16} className="text-gray-500 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Adjust dose based on patient's hemodynamic status and comorbidities
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rocuronium Calculator */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Rocuronium</h2>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRSI}
                onChange={(e) => setIsRSI(e.target.checked)}
                className="rounded"
              />
              <span>Rapid Sequence Intubation (RSI)</span>
            </label>
          </div>

          {rocuroniumResult && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {rocuroniumResult.dose} mg
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {rocuroniumResult.indication}
              </div>
              <div className="mt-2 flex items-start gap-1">
                <Info size={16} className="text-gray-500 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Standard: 0.6 mg/kg | RSI: 1.2 mg/kg
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Anesthetic Calculator */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Local Anesthetic Maximum Dose</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Type
              </label>
              <select
                value={drugType}
                onChange={(e) => setDrugType(e.target.value as 'lidocaine' | 'bupivacaine')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="lidocaine">Lidocaine</option>
                <option value="bupivacaine">Bupivacaine</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={withEpi}
                  onChange={(e) => setWithEpi(e.target.checked)}
                  className="rounded"
                />
                <span>With Epinephrine</span>
              </label>
            </div>
          </div>

          {localResult && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {localResult.dose} mg
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Maximum dose: {localResult.mgPerKg} mg/kg (absolute max: {localResult.maxAbsolute} mg)
              </div>
              <div className="mt-2 flex items-start gap-1">
                <Info size={16} className="text-gray-500 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Always aspirate before injection. Monitor for signs of local anesthetic systemic toxicity.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Pediatric Calculators Section */}
      {activeTab === 'pediatric' && (
        <div className="card">
          <PediatricCalculator />
        </div>
      )}
    </div>
  )
}

export default Calculators