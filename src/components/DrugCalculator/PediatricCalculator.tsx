import React, { useState, useEffect } from 'react'
import { Calculator, AlertTriangle, Info, Baby, User } from 'lucide-react'
import {
  calculateFentanyl,
  calculateMidazolam,
  calculateKetamine,
  calculateAtropine,
  calculatePediatricPropofol,
  calculatePediatricSuccinylcholine,
  ageInYears,
  getAgeCategory,
  type PediatricPatient,
  type DrugDose
} from '../../utils/calculations/pediatricDosing'

const PediatricCalculator: React.FC = () => {
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [ageUnit, setAgeUnit] = useState<'years' | 'months' | 'weeks'>('years')
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(['fentanyl', 'midazolam', 'ketamine', 'atropine'])
  const [calculations, setCalculations] = useState<DrugDose[]>([])

  // Calculate all selected drugs when inputs change
  useEffect(() => {
    if (!weight || !age) {
      setCalculations([])
      return
    }

    const patient: PediatricPatient = {
      weight: parseFloat(weight),
      age: parseFloat(age),
      ageUnit
    }

    const results: DrugDose[] = []

    if (selectedDrugs.includes('fentanyl')) {
      results.push(calculateFentanyl(patient, 'induction'))
      results.push(calculateFentanyl(patient, 'maintenance'))
    }

    if (selectedDrugs.includes('midazolam')) {
      results.push(calculateMidazolam(patient, 'po'))
      results.push(calculateMidazolam(patient, 'iv'))
      results.push(calculateMidazolam(patient, 'intranasal'))
    }

    if (selectedDrugs.includes('ketamine')) {
      results.push(calculateKetamine(patient, 'iv-induction'))
      results.push(calculateKetamine(patient, 'sedation'))
      results.push(calculateKetamine(patient, 'analgesia'))
    }

    if (selectedDrugs.includes('atropine')) {
      results.push(calculateAtropine(patient))
    }

    if (selectedDrugs.includes('propofol')) {
      results.push(calculatePediatricPropofol(patient, 'induction'))
      results.push(calculatePediatricPropofol(patient, 'maintenance'))
    }

    if (selectedDrugs.includes('succinylcholine')) {
      results.push(calculatePediatricSuccinylcholine(patient, 'iv'))
    }

    setCalculations(results)
  }, [weight, age, ageUnit, selectedDrugs])

  const getAgeDisplay = () => {
    if (!age) return ''
    const ageYears = ageInYears(parseFloat(age), ageUnit)
    const category = getAgeCategory(ageYears)
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getAgeIcon = () => {
    if (!age) return null
    const ageYears = ageInYears(parseFloat(age), ageUnit)
    const category = getAgeCategory(ageYears)
    
    if (category === 'neonate' || category === 'infant') {
      return <Baby className="text-pink-500" size={20} />
    }
    return <User className="text-blue-500" size={20} />
  }

  const getDoseColor = (drug: string): string => {
    const colorMap: { [key: string]: string } = {
      'Fentanyl': 'bg-purple-50 border-purple-200',
      'Midazolam': 'bg-blue-50 border-blue-200',
      'Ketamine': 'bg-green-50 border-green-200',
      'Atropine': 'bg-red-50 border-red-200',
      'Propofol': 'bg-yellow-50 border-yellow-200',
      'Succinylcholine': 'bg-orange-50 border-orange-200'
    }
    return colorMap[drug] || 'bg-gray-50 border-gray-200'
  }

  const availableDrugs = [
    { id: 'fentanyl', name: 'Fentanyl', description: 'Opioid analgesic' },
    { id: 'midazolam', name: 'Midazolam', description: 'Benzodiazepine sedative' },
    { id: 'ketamine', name: 'Ketamine', description: 'Dissociative anesthetic' },
    { id: 'atropine', name: 'Atropine', description: 'Anticholinergic' },
    { id: 'propofol', name: 'Propofol', description: 'IV anesthetic' },
    { id: 'succinylcholine', name: 'Succinylcholine', description: 'Depolarizing muscle relaxant' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-6 rounded-lg border border-pink-200">
        <div className="flex items-center gap-3 mb-2">
          <Baby className="text-pink-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Pediatric Drug Calculator</h2>
        </div>
        <p className="text-gray-600">Weight-based dosing with age-appropriate safety limits</p>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={16} />
            <p className="text-sm text-yellow-800">
              Always verify doses with institutional protocols and consider patient-specific factors. 
              These calculations are for reference only.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            min="0.5"
            max="100"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter age"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            min="0"
            step="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Unit
          </label>
          <select
            value={ageUnit}
            onChange={(e) => setAgeUnit(e.target.value as 'years' | 'months' | 'weeks')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </div>

      {/* Age Category Display */}
      {age && weight && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          {getAgeIcon()}
          <span className="font-medium">Patient Category:</span>
          <span className="text-lg font-bold text-gray-900">{getAgeDisplay()}</span>
          {ageInYears(parseFloat(age), ageUnit) < 0.077 && (
            <span className="ml-auto text-sm text-red-600 font-medium">
              ⚠️ Neonatal dosing - Use extreme caution
            </span>
          )}
        </div>
      )}

      {/* Drug Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Drugs to Calculate:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableDrugs.map((drug) => (
            <label
              key={drug.id}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedDrugs.includes(drug.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDrugs([...selectedDrugs, drug.id])
                  } else {
                    setSelectedDrugs(selectedDrugs.filter(d => d !== drug.id))
                  }
                }}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{drug.name}</div>
                <div className="text-sm text-gray-500">{drug.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Calculation Results */}
      {calculations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Calculated Doses:</h3>
          
          {/* Group calculations by drug */}
          {Array.from(new Set(calculations.map(c => c.drug))).map(drugName => {
            const drugCalcs = calculations.filter(c => c.drug === drugName)
            
            return (
              <div key={drugName} className={`border rounded-lg p-4 ${getDoseColor(drugName)}`}>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Calculator size={20} />
                  {drugName}
                </h4>
                
                <div className="space-y-3">
                  {drugCalcs.map((calc, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-700">{calc.indication}:</span>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {calc.dose} {calc.unit}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{calc.route}</div>
                          <div className="font-medium">{calc.perKg} {calc.unit === 'mcg/kg/min' ? 'mcg/kg/min' : `${calc.unit}/kg`}</div>
                        </div>
                      </div>
                      
                      {calc.dilution && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Dilution:</span> {calc.dilution}
                        </div>
                      )}
                      
                      {(calc.min || calc.max || calc.absoluteMax) && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Limits:</span>
                          {calc.min && ` Min: ${calc.min} ${calc.unit}`}
                          {calc.max && ` Max: ${calc.max} ${calc.unit}`}
                          {calc.absoluteMax && ` (Absolute max: ${calc.absoluteMax} ${calc.unit})`}
                        </div>
                      )}
                      
                      {calc.warning && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-1">
                          <Info className="text-yellow-600 mt-0.5" size={14} />
                          <p className="text-xs text-yellow-800">{calc.warning}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reference Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Quick Reference:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
          <div>
            <strong>Age Categories:</strong>
            <ul className="ml-4 mt-1">
              <li>• Neonate: &lt; 4 weeks</li>
              <li>• Infant: 4 weeks - 1 year</li>
              <li>• Child: 1 - 12 years</li>
              <li>• Adolescent: &gt; 12 years</li>
            </ul>
          </div>
          <div>
            <strong>Important Notes:</strong>
            <ul className="ml-4 mt-1">
              <li>• Neonates require special dosing</li>
              <li>• Consider atropine with succinylcholine</li>
              <li>• Verify maximum doses</li>
              <li>• Adjust for clinical condition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PediatricCalculator