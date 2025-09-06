import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface MedicalDisclaimerProps {
  prominent?: boolean
  dismissible?: boolean
  position?: 'top' | 'bottom'
}

const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  prominent = true,
  dismissible = false,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible && dismissible) return null

  return (
    <div 
      className={`
        ${prominent ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-yellow-50/80 border border-yellow-300'}
        ${position === 'top' ? 'mb-4' : 'mt-4'}
        p-4 rounded-lg shadow-sm
      `}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
        <div className="flex-1">
          <h3 className="font-bold text-yellow-800 mb-1">Medical Disclaimer</h3>
          <p className="text-sm text-yellow-700">
            This tool is for educational and informational purposes only. 
            Clinical judgment should always supersede AI recommendations. 
            Verify critical information from primary sources and institutional protocols.
            Never use this tool as the sole basis for clinical decisions.
          </p>
        </div>
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-600 hover:text-yellow-800 ml-2"
            aria-label="Dismiss disclaimer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default MedicalDisclaimer