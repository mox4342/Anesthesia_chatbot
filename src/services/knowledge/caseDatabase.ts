// Case Database Service - Local storage for anesthesia cases
import Dexie, { type Table } from 'dexie';

export interface AnesthesiaCase {
  id?: string;
  caseDate: Date;
  
  // Patient Demographics
  patient: {
    age: number;
    ageUnit: 'days' | 'months' | 'years';
    weight: number; // kg
    height?: number; // cm
    sex: 'M' | 'F' | 'Other';
    asa: 1 | 2 | 3 | 4 | 5 | 6;
    comorbidities: string[];
    allergies: string[];
    medications: string[];
  };
  
  // Surgical Details
  procedure: {
    name: string;
    specialty: string;
    urgency: 'elective' | 'urgent' | 'emergent';
    duration: number; // minutes
    position: string;
    bloodLoss: number; // ml
    fluidsGiven: {
      crystalloid: number;
      colloid: number;
      bloodProducts: string[];
    };
  };
  
  // Anesthetic Management
  anesthetic: {
    technique: 'general' | 'regional' | 'MAC' | 'combined';
    airway: string; // ETT, LMA, mask, etc.
    induction: {
      drug: string;
      dose: number;
      unit: string;
    }[];
    maintenance: string[];
    regionalDetails?: {
      blockType: string;
      localAnesthetic: string;
      volume: number;
      additives: string[];
    };
    emergence: string;
    extubation: 'deep' | 'awake' | 'delayed';
  };
  
  // Medications Used
  medications: {
    name: string;
    dose: number;
    unit: string;
    timing: string;
    indication: string;
  }[];
  
  // Complications & Management
  complications: {
    event: string;
    timing: 'preop' | 'induction' | 'maintenance' | 'emergence' | 'pacu';
    management: string;
    outcome: string;
  }[];
  
  // Clinical Pearls & Notes
  clinicalPearls: string[];
  keyTakeaways: string[];
  wouldDoAgain: string;
  wouldChangePerspective: string;
  
  // Outcomes
  outcome: {
    pacuDuration: number; // minutes
    complications: boolean;
    admission: 'home' | 'floor' | 'ICU';
    patientSatisfaction?: number; // 1-10
    qualityScore?: number; // Your assessment 1-10
  };
  
  // Search Optimization
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Database Schema
class CaseDatabase extends Dexie {
  cases!: Table<AnesthesiaCase>;
  
  constructor() {
    super('AnesthesiaCaseDB');
    
    this.version(1).stores({
      cases: '++id, caseDate, [patient.age], [patient.asa], [procedure.name], [procedure.specialty], [anesthetic.technique], *keywords, createdAt'
    });
  }
}

// Initialize database
export const db = new CaseDatabase();

// Case Database Service
export class CaseService {
  // Add a new case
  static async addCase(caseData: Omit<AnesthesiaCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newCase = {
      ...caseData,
      createdAt: new Date(),
      updatedAt: new Date(),
      keywords: this.generateKeywords(caseData)
    };
    
    const id = await db.cases.add(newCase);
    return id.toString();
  }
  
  // Bulk import cases
  static async importCases(cases: Omit<AnesthesiaCase, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const processedCases = cases.map(c => ({
      ...c,
      createdAt: new Date(),
      updatedAt: new Date(),
      keywords: this.generateKeywords(c)
    }));
    
    return await db.cases.bulkAdd(processedCases);
  }
  
  // Search cases by multiple criteria
  static async searchCases(criteria: {
    text?: string;
    ageRange?: { min: number; max: number };
    asa?: number[];
    procedure?: string;
    technique?: string;
    complications?: boolean;
  }): Promise<AnesthesiaCase[]> {
    let query = db.cases.toCollection();
    
    if (criteria.asa && criteria.asa.length > 0) {
      query = query.filter(c => criteria.asa!.includes(c.patient.asa));
    }
    
    if (criteria.technique) {
      query = query.filter(c => c.anesthetic.technique === criteria.technique);
    }
    
    if (criteria.complications !== undefined) {
      query = query.filter(c => c.complications.length > 0 === criteria.complications);
    }
    
    let results = await query.toArray();
    
    // Text search across multiple fields
    if (criteria.text) {
      const searchText = criteria.text.toLowerCase();
      results = results.filter(c => 
        c.procedure.name.toLowerCase().includes(searchText) ||
        c.procedure.specialty.toLowerCase().includes(searchText) ||
        c.keywords.some(k => k.toLowerCase().includes(searchText)) ||
        c.clinicalPearls.some(p => p.toLowerCase().includes(searchText)) ||
        c.patient.comorbidities.some(co => co.toLowerCase().includes(searchText))
      );
    }
    
    // Age range filter
    if (criteria.ageRange) {
      results = results.filter(c => {
        const ageInYears = this.convertToYears(c.patient.age, c.patient.ageUnit);
        return ageInYears >= criteria.ageRange!.min && ageInYears <= criteria.ageRange!.max;
      });
    }
    
    return results;
  }
  
  // Find similar cases based on patient and procedure
  static async findSimilarCases(
    referenceCase: Partial<AnesthesiaCase>, 
    limit: number = 5
  ): Promise<AnesthesiaCase[]> {
    const allCases = await db.cases.toArray();
    
    // Calculate similarity scores
    const scoredCases = allCases.map(c => ({
      case: c,
      score: this.calculateSimilarity(referenceCase, c)
    }));
    
    // Sort by similarity and return top matches
    return scoredCases
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sc => sc.case);
  }
  
  // Get cases for AI context
  static async getCasesForContext(query: string, limit: number = 3): Promise<string> {
    const relevantCases = await this.searchCases({ text: query });
    const topCases = relevantCases.slice(0, limit);
    
    if (topCases.length === 0) {
      return '';
    }
    
    return topCases.map((c, index) => `
Case #${index + 1}:
- Patient: ${c.patient.age}${c.patient.ageUnit.charAt(0)}, ${c.patient.weight}kg, ASA ${c.patient.asa}
- Procedure: ${c.procedure.name} (${c.procedure.urgency})
- Technique: ${c.anesthetic.technique}
- Induction: ${c.anesthetic.induction.map(d => `${d.drug} ${d.dose}${d.unit}`).join(', ')}
- Complications: ${c.complications.length > 0 ? c.complications.map(co => co.event).join(', ') : 'None'}
- Clinical Pearls: ${c.clinicalPearls.join('; ')}
- Key Takeaway: ${c.keyTakeaways.join('; ')}
    `).join('\n---\n');
  }
  
  // Helper: Generate keywords for search
  private static generateKeywords(caseData: Omit<AnesthesiaCase, 'id' | 'createdAt' | 'updatedAt' | 'keywords'>): string[] {
    const keywords: string[] = [];
    
    // Add procedure-related keywords
    keywords.push(caseData.procedure.name.toLowerCase());
    keywords.push(caseData.procedure.specialty.toLowerCase());
    
    // Add technique keywords
    keywords.push(caseData.anesthetic.technique);
    if (caseData.anesthetic.regionalDetails) {
      keywords.push(caseData.anesthetic.regionalDetails.blockType.toLowerCase());
    }
    
    // Add drug names
    caseData.anesthetic.induction.forEach(drug => {
      keywords.push(drug.drug.toLowerCase());
    });
    
    // Add comorbidities
    keywords.push(...caseData.patient.comorbidities.map(c => c.toLowerCase()));
    
    // Add complication keywords
    caseData.complications.forEach(comp => {
      keywords.push(comp.event.toLowerCase());
    });
    
    // Add age category
    const ageInYears = this.convertToYears(caseData.patient.age, caseData.patient.ageUnit);
    if (ageInYears < 1) keywords.push('infant', 'neonate');
    else if (ageInYears < 3) keywords.push('toddler');
    else if (ageInYears < 12) keywords.push('pediatric', 'child');
    else if (ageInYears < 18) keywords.push('adolescent');
    else if (ageInYears > 65) keywords.push('elderly', 'geriatric');
    
    return [...new Set(keywords)]; // Remove duplicates
  }
  
  // Helper: Calculate similarity score between cases
  private static calculateSimilarity(ref: Partial<AnesthesiaCase>, compare: AnesthesiaCase): number {
    let score = 0;
    
    // Age similarity (max 20 points)
    if (ref.patient?.age && ref.patient?.ageUnit) {
      const refAge = this.convertToYears(ref.patient.age, ref.patient.ageUnit);
      const compAge = this.convertToYears(compare.patient.age, compare.patient.ageUnit);
      const ageDiff = Math.abs(refAge - compAge);
      score += Math.max(0, 20 - ageDiff * 2);
    }
    
    // ASA status match (20 points)
    if (ref.patient?.asa && ref.patient.asa === compare.patient.asa) {
      score += 20;
    }
    
    // Procedure similarity (30 points)
    if (ref.procedure?.name && 
        compare.procedure.name.toLowerCase().includes(ref.procedure.name.toLowerCase())) {
      score += 30;
    } else if (ref.procedure?.specialty === compare.procedure.specialty) {
      score += 15;
    }
    
    // Technique match (20 points)
    if (ref.anesthetic?.technique === compare.anesthetic.technique) {
      score += 20;
    }
    
    // Comorbidity overlap (10 points)
    if (ref.patient?.comorbidities) {
      const overlap = ref.patient.comorbidities.filter(c => 
        compare.patient.comorbidities.includes(c)
      ).length;
      score += Math.min(10, overlap * 3);
    }
    
    return score;
  }
  
  // Helper: Convert age to years
  private static convertToYears(age: number, unit: 'days' | 'months' | 'years'): number {
    switch (unit) {
      case 'days': return age / 365;
      case 'months': return age / 12;
      case 'years': return age;
      default: return age;
    }
  }
  
  // Get statistics about the database
  static async getStatistics() {
    const totalCases = await db.cases.count();
    const cases = await db.cases.toArray();
    
    const stats = {
      totalCases,
      byTechnique: {} as Record<string, number>,
      byASA: {} as Record<number, number>,
      bySpecialty: {} as Record<string, number>,
      complicationRate: 0,
      averageQualityScore: 0
    };
    
    cases.forEach(c => {
      // Technique distribution
      stats.byTechnique[c.anesthetic.technique] = (stats.byTechnique[c.anesthetic.technique] || 0) + 1;
      
      // ASA distribution
      stats.byASA[c.patient.asa] = (stats.byASA[c.patient.asa] || 0) + 1;
      
      // Specialty distribution
      stats.bySpecialty[c.procedure.specialty] = (stats.bySpecialty[c.procedure.specialty] || 0) + 1;
    });
    
    // Calculate complication rate
    const casesWithComplications = cases.filter(c => c.complications.length > 0).length;
    stats.complicationRate = totalCases > 0 ? (casesWithComplications / totalCases) * 100 : 0;
    
    // Calculate average quality score
    const qualityScores = cases
      .filter(c => c.outcome.qualityScore !== undefined)
      .map(c => c.outcome.qualityScore!);
    stats.averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0;
    
    return stats;
  }
}