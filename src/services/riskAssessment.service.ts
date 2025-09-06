// OSA Risk Assessment Service - Based on Critical Incident Case
import { sampleCases } from '../data/sample_cases.json';

interface RiskFactors {
  hasOSA: boolean;
  suspectedOSA: boolean;
  plannedTechnique: string;
  sedationPlanned: boolean;
  patientAge: number;
  bmi?: number;
  neckCircumference?: number;
}

interface RiskAlert {
  level: 'critical' | 'high' | 'moderate' | 'low';
  message: string;
  recommendations: string[];
  relatedCase?: any;
}

export class RiskAssessmentService {
  // Based on the cardiac arrest case from 2024-04-15
  private criticalCombinations = [
    {
      conditions: ['OSA', 'spinal', 'sedation'],
      alert: 'CRITICAL RISK: OSA + Neuraxial + Sedation can cause cardiac arrest',
      recommendations: [
        'Consider spinal WITHOUT sedation',
        'If sedation required, use high-flow nasal cannula or CPAP',
        'Consider GA with secured airway instead',
        'Maintain sitting position longer after spinal'
      ]
    }
  ];

  assessPreoperativeRisk(factors: RiskFactors): RiskAlert {
    // Check for the exact scenario from the cardiac arrest case
    if ((factors.hasOSA || factors.suspectedOSA) && 
        factors.plannedTechnique.includes('spinal') && 
        factors.sedationPlanned) {
      
      // Find the relevant case for reference
      const relevantCase = this.findSimilarCase('cardiac arrest', 'OSA', 'spinal');
      
      return {
        level: 'critical',
        message: 'WARNING: This combination led to cardiac arrest in a similar case (59yo male, pH 7.0, pCO2 110)',
        recommendations: [
          '❌ DO NOT provide sedation with neuraxial block in OSA patients',
          '✅ Consider spinal WITHOUT any sedation',
          '✅ If anxious, use minimal anxiolysis BEFORE spinal only',
          '✅ Keep patient sitting/semi-upright after block',
          '✅ Have airway equipment and ACLS drugs immediately available',
          '📋 Review case: 59yo HTN patient, cardiac arrest after propofol 50mcg/kg/min'
        ],
        relatedCase: relevantCase
      };
    }

    return this.standardRiskAssessment(factors);
  }

  // STOP-BANG Screening Implementation
  calculateSTOPBANG(patient: any): number {
    let score = 0;
    
    // S - Snoring
    if (patient.snoring) score++;
    
    // T - Tired/Fatigue
    if (patient.daytimeFatigue) score++;
    
    // O - Observed apnea
    if (patient.observedApnea) score++;
    
    // P - Pressure (HTN)
    if (patient.comorbidities?.includes('HTN')) score++;
    
    // B - BMI > 35
    if (patient.bmi > 35) score++;
    
    // A - Age > 50
    if (patient.age > 50) score++;
    
    // N - Neck circumference > 40cm
    if (patient.neckCircumference > 40) score++;
    
    // G - Gender male
    if (patient.sex === 'M') score++;
    
    return score;
  }

  interpretSTOPBANG(score: number): string {
    if (score >= 5) return 'HIGH RISK for OSA';
    if (score >= 3) return 'INTERMEDIATE RISK for OSA';
    return 'LOW RISK for OSA';
  }

  // Find similar cases for learning
  private findSimilarCase(...keywords: string[]): any {
    const cases = require('../data/sample_cases.json');
    return cases.find((c: any) => 
      keywords.every(keyword => 
        JSON.stringify(c).toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private standardRiskAssessment(factors: RiskFactors): RiskAlert {
    // Default assessment for other scenarios
    let level: 'critical' | 'high' | 'moderate' | 'low' = 'low';
    const recommendations: string[] = [];

    if (factors.suspectedOSA && !factors.hasOSA) {
      level = 'moderate';
      recommendations.push('Perform STOP-BANG screening');
      recommendations.push('Consider sleep study if time permits');
    }

    return {
      level,
      message: `Standard risk assessment: ${level} risk`,
      recommendations
    };
  }
}

// Emergency Response Generator based on the cardiac arrest case
export class EmergencyProtocolGenerator {
  generateResponsePlan(complication: string): any {
    if (complication.includes('cardiac arrest') || complication.includes('PEA')) {
      return {
        immediate: [
          'Call for help - activate code team',
          'Start CPR immediately',
          'Secure airway - intubate if not already',
          'Epinephrine 1mg IV q3-5min',
          'Check ABG - likely severe respiratory acidosis'
        ],
        medications: [
          { drug: 'Epinephrine', dose: '1mg IV', frequency: 'q3-5min' },
          { drug: 'Sodium Bicarbonate', dose: '50mEq', indication: 'If pH < 7.2' }
        ],
        monitoring: [
          'Continuous CPR with minimal interruptions',
          'ETCO2 monitoring (goal > 10-20)',
          'Check for ROSC every 2 minutes',
          'ABG to guide bicarbonate therapy'
        ],
        specific: {
          'If OSA-related': [
            'Consider respiratory cause - focus on ventilation',
            'Expect severe hypercarbia (pCO2 may be > 100)',
            'Multiple doses of bicarbonate may be needed',
            'Plan for ICU admission even after ROSC'
          ]
        },
        reference: 'Based on successful resuscitation: 59yo male, 20min CPR, full recovery'
      };
    }
    
    // Add other emergency protocols
    return null;
  }
}