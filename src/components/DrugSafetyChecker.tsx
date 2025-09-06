import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface DrugCombination {
  drugs: string[];
  patientFactors: {
    hasOSA?: boolean;
    age?: number;
    weight?: number;
    technique?: string;
  };
}

interface SafetyAlert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  caseReference?: string;
  alternatives?: string[];
}

export const DrugSafetyChecker: React.FC = () => {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [patientOSA, setPatientOSA] = useState(false);
  const [anesthesiaTechnique, setAnesthesiaTechnique] = useState('');
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  // Based on the cardiac arrest case
  const dangerousCombinations = [
    {
      drugs: ['midazolam', 'fentanyl', 'propofol'],
      condition: 'OSA',
      technique: 'spinal',
      alert: {
        severity: 'critical' as const,
        message: '⚠️ CRITICAL: This exact combination caused cardiac arrest in OSA patient with spinal',
        caseReference: '59yo male, pH 7.0, pCO2 110, 20min CPR required',
        alternatives: [
          'Use spinal WITHOUT sedation',
          'If sedation needed: Dexmedetomidine only (preserves airway reflexes)',
          'Consider GA with secured airway'
        ]
      }
    },
    {
      drugs: ['propofol'],
      condition: 'OSA',
      technique: 'MAC',
      alert: {
        severity: 'warning' as const,
        message: 'Propofol infusion in OSA requires extreme caution',
        caseReference: 'Even 50mcg/kg/min caused complete obstruction',
        alternatives: [
          'Use high-flow nasal cannula',
          'Consider CPAP during sedation',
          'Have intubation equipment ready'
        ]
      }
    }
  ];

  useEffect(() => {
    checkDrugSafety();
  }, [selectedDrugs, patientOSA, anesthesiaTechnique]);

  const checkDrugSafety = () => {
    const alerts: SafetyAlert[] = [];

    dangerousCombinations.forEach(combo => {
      const hasAllDrugs = combo.drugs.every(drug => 
        selectedDrugs.some(selected => selected.toLowerCase().includes(drug))
      );

      if (hasAllDrugs) {
        if (combo.condition === 'OSA' && patientOSA) {
          if (!combo.technique || combo.technique === anesthesiaTechnique) {
            alerts.push(combo.alert);
          }
        }
      }
    });

    // Add general OSA warning if applicable
    if (patientOSA && selectedDrugs.length > 0 && anesthesiaTechnique === 'spinal') {
      alerts.push({
        severity: 'info',
        message: 'Consider avoiding ALL sedation with neuraxial blocks in OSA patients',
        caseReference: 'Multiple near-miss events reported with this combination'
      });
    }

    setSafetyAlerts(alerts);
  };

  const commonAnesthesiaDrugs = [
    'Propofol', 'Midazolam', 'Fentanyl', 'Remifentanil',
    'Ketamine', 'Dexmedetomidine', 'Sevoflurane', 'Rocuronium'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Drug Safety Checker</h2>
      
      {/* Patient Factors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Patient Factors</h3>
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={patientOSA}
            onChange={(e) => setPatientOSA(e.target.checked)}
            className="mr-2"
          />
          Patient has known or suspected OSA
        </label>
        
        <select
          value={anesthesiaTechnique}
          onChange={(e) => setAnesthesiaTechnique(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select anesthesia technique...</option>
          <option value="general">General Anesthesia</option>
          <option value="spinal">Spinal Anesthesia</option>
          <option value="epidural">Epidural</option>
          <option value="MAC">MAC/Sedation</option>
          <option value="combined">Combined Spinal-Epidural</option>
        </select>
      </div>

      {/* Drug Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Selected Drugs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {commonAnesthesiaDrugs.map(drug => (
            <label key={drug} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedDrugs.includes(drug)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDrugs([...selectedDrugs, drug]);
                  } else {
                    setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
                  }
                }}
                className="mr-2"
              />
              {drug}
            </label>
          ))}
        </div>
      </div>

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <div className="space-y-3">
          {safetyAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                alert.severity === 'critical' 
                  ? 'bg-red-50 border-red-500' 
                  : alert.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start">
                {alert.severity === 'critical' ? (
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{alert.message}</p>
                  {alert.caseReference && (
                    <p className="text-sm text-gray-600 mt-1">
                      Case Reference: {alert.caseReference}
                    </p>
                  )}
                  {alert.alternatives && (
                    <div className="mt-3">
                      <p className="font-medium">Safer Alternatives:</p>
                      <ul className="list-disc list-inside text-sm">
                        {alert.alternatives.map((alt, i) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Issues */}
      {safetyAlerts.length === 0 && selectedDrugs.length > 0 && (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <p>No critical drug interactions identified with current selection</p>
          </div>
        </div>
      )}
    </div>
  );
};