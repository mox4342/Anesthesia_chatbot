/**
 * Pediatric Drug Dosing Calculations
 * All doses are weight-based with age-appropriate maximum limits
 * References: Cote's A Practice of Anesthesia for Infants and Children
 */

export interface PediatricPatient {
  weight: number; // kg
  age: number; // years
  ageUnit: 'years' | 'months' | 'weeks';
}

export interface DrugDose {
  drug: string;
  indication: string;
  dose: number;
  unit: string;
  min?: number;
  max?: number;
  perKg: number;
  absoluteMax?: number;
  warning?: string;
  dilution?: string;
  route: string;
}

// Convert age to years for calculations
export const ageInYears = (age: number, unit: 'years' | 'months' | 'weeks'): number => {
  switch (unit) {
    case 'years':
      return age;
    case 'months':
      return age / 12;
    case 'weeks':
      return age / 52;
    default:
      return age;
  }
};

// Determine if patient is neonate, infant, child, or adolescent
export const getAgeCategory = (ageYears: number): string => {
  if (ageYears < 0.077) return 'neonate'; // < 4 weeks
  if (ageYears < 1) return 'infant';
  if (ageYears < 12) return 'child';
  return 'adolescent';
};

/**
 * FENTANYL DOSING
 * Induction: 1-3 mcg/kg
 * Maintenance: 0.5-1 mcg/kg
 * High dose: 5-10 mcg/kg (cardiac)
 */
export const calculateFentanyl = (
  patient: PediatricPatient,
  indication: 'induction' | 'maintenance' | 'cardiac'
): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  let perKg = 0;
  let maxDose = 0;
  let warning = '';

  switch (indication) {
    case 'induction':
      perKg = category === 'neonate' ? 1 : 2; // mcg/kg
      maxDose = Math.min(patient.weight * perKg, 100); // max 100 mcg for induction
      break;
    case 'maintenance':
      perKg = 0.5; // mcg/kg
      maxDose = Math.min(patient.weight * perKg, 50);
      break;
    case 'cardiac':
      perKg = category === 'neonate' ? 5 : 10; // mcg/kg
      maxDose = patient.weight * perKg; // No absolute max for cardiac
      warning = 'High dose - cardiac anesthesia only';
      break;
  }

  if (category === 'neonate') {
    warning += warning ? '. ' : '';
    warning += 'Neonatal patient - use lower doses and monitor closely';
  }

  return {
    drug: 'Fentanyl',
    indication,
    dose: parseFloat(maxDose.toFixed(1)),
    unit: 'mcg',
    perKg,
    max: maxDose,
    warning,
    dilution: '50 mcg/mL (standard dilution)',
    route: 'IV'
  };
};

/**
 * MIDAZOLAM DOSING
 * PO premedication: 0.5-0.75 mg/kg (max 20mg)
 * IV sedation: 0.05-0.1 mg/kg
 * Intranasal: 0.2-0.3 mg/kg
 */
export const calculateMidazolam = (
  patient: PediatricPatient,
  route: 'po' | 'iv' | 'intranasal'
): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  let perKg = 0;
  let maxDose = 0;
  let absoluteMax = 0;
  let warning = '';
  let routeStr = '';
  let dilution = '';

  switch (route) {
    case 'po':
      perKg = 0.5; // mg/kg
      absoluteMax = 20; // mg
      maxDose = Math.min(patient.weight * perKg, absoluteMax);
      routeStr = 'PO';
      dilution = '2 mg/mL syrup';
      if (ageYears < 0.5) {
        warning = 'Use with caution in infants < 6 months';
      }
      break;
    case 'iv':
      perKg = category === 'neonate' ? 0.05 : 0.1; // mg/kg
      absoluteMax = 5; // mg for single dose
      maxDose = Math.min(patient.weight * perKg, absoluteMax);
      routeStr = 'IV';
      dilution = '1 mg/mL';
      break;
    case 'intranasal':
      perKg = 0.2; // mg/kg
      absoluteMax = 10; // mg
      maxDose = Math.min(patient.weight * perKg, absoluteMax);
      routeStr = 'Intranasal';
      dilution = '5 mg/mL (undiluted)';
      if (maxDose > 1) {
        warning = 'Divide dose between nostrils if > 1 mL';
      }
      break;
  }

  if (category === 'neonate') {
    warning += warning ? '. ' : '';
    warning += 'Neonatal patient - increased sensitivity to benzodiazepines';
  }

  return {
    drug: 'Midazolam',
    indication: `${routeStr} sedation`,
    dose: parseFloat(maxDose.toFixed(2)),
    unit: 'mg',
    perKg,
    absoluteMax,
    warning,
    dilution,
    route: routeStr
  };
};

/**
 * KETAMINE DOSING
 * IV induction: 1-2 mg/kg
 * IM induction: 4-6 mg/kg
 * Sedation: 0.5-1 mg/kg IV
 * Analgesia: 0.25-0.5 mg/kg IV
 */
export const calculateKetamine = (
  patient: PediatricPatient,
  indication: 'iv-induction' | 'im-induction' | 'sedation' | 'analgesia'
): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  let perKg = 0;
  let maxDose = 0;
  let warning = '';
  let route = 'IV';
  let indicationStr = '';

  switch (indication) {
    case 'iv-induction':
      perKg = category === 'neonate' ? 1 : 2; // mg/kg
      maxDose = Math.min(patient.weight * perKg, 150); // max 150mg
      indicationStr = 'IV induction';
      break;
    case 'im-induction':
      perKg = 5; // mg/kg
      maxDose = Math.min(patient.weight * perKg, 300); // max 300mg
      route = 'IM';
      indicationStr = 'IM induction';
      warning = 'Consider atropine pretreatment for hypersalivation';
      break;
    case 'sedation':
      perKg = 0.5; // mg/kg
      maxDose = Math.min(patient.weight * perKg, 50);
      indicationStr = 'Procedural sedation';
      break;
    case 'analgesia':
      perKg = 0.25; // mg/kg
      maxDose = Math.min(patient.weight * perKg, 25);
      indicationStr = 'Analgesia';
      warning = 'Sub-dissociative dose';
      break;
  }

  if (ageYears < 0.25) { // < 3 months
    warning += warning ? '. ' : '';
    warning += 'Use with caution in infants < 3 months';
  }

  if (category === 'adolescent' && patient.weight > 50) {
    warning += warning ? '. ' : '';
    warning += 'Consider adult dosing for larger adolescents';
  }

  return {
    drug: 'Ketamine',
    indication: indicationStr,
    dose: parseFloat(maxDose.toFixed(1)),
    unit: 'mg',
    perKg,
    absoluteMax: maxDose,
    warning,
    dilution: route === 'IV' ? '10 mg/mL' : '50 mg/mL',
    route
  };
};

/**
 * ATROPINE DOSING
 * Standard: 0.02 mg/kg (min 0.1mg, max 0.5mg child, 1mg adolescent)
 * For bradycardia during anesthesia
 */
export const calculateAtropine = (patient: PediatricPatient): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  const perKg = 0.02; // mg/kg
  const minDose = 0.1; // mg - to avoid paradoxical bradycardia
  const maxByAge = category === 'adolescent' ? 1.0 : 0.5; // mg
  
  let calculatedDose = patient.weight * perKg;
  
  // Apply minimum and maximum limits
  if (calculatedDose < minDose) {
    calculatedDose = minDose;
  }
  if (calculatedDose > maxByAge) {
    calculatedDose = maxByAge;
  }

  let warning = '';
  if (patient.weight * perKg < minDose) {
    warning = `Minimum dose given (calculated ${(patient.weight * perKg).toFixed(3)} mg)`;
  }
  
  if (ageYears < 0.077) { // neonate
    warning += warning ? '. ' : '';
    warning += 'May need higher doses in neonates';
  }

  return {
    drug: 'Atropine',
    indication: 'Bradycardia/Antisialagogue',
    dose: parseFloat(calculatedDose.toFixed(2)),
    unit: 'mg',
    perKg,
    min: minDose,
    max: maxByAge,
    warning,
    dilution: '0.1 mg/mL for accurate dosing',
    route: 'IV/IM'
  };
};

/**
 * PROPOFOL DOSING (Pediatric)
 * Induction: 2.5-3.5 mg/kg (infants may need more)
 * Maintenance infusion: 100-300 mcg/kg/min
 */
export const calculatePediatricPropofol = (
  patient: PediatricPatient,
  indication: 'induction' | 'maintenance'
): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  let dose = 0;
  let unit = 'mg';
  let perKg = 0;
  let warning = '';
  let indicationStr = '';

  if (indication === 'induction') {
    // Infants often need higher doses due to larger Vd
    perKg = category === 'infant' ? 3.5 : 2.5; // mg/kg
    dose = patient.weight * perKg;
    indicationStr = 'Induction';
    
    if (ageYears < 0.25) { // < 3 months
      warning = 'Not recommended for induction in infants < 3 months';
    }
  } else {
    // Maintenance infusion in mcg/kg/min
    perKg = 150; // mcg/kg/min (middle of range)
    dose = perKg;
    unit = 'mcg/kg/min';
    indicationStr = 'Maintenance infusion';
    warning = 'Typical range: 100-300 mcg/kg/min. Titrate to effect.';
    
    if (ageYears < 0.25) {
      warning += ' Not recommended for maintenance in infants < 3 months';
    }
  }

  if (category === 'infant' || category === 'neonate') {
    warning += warning ? '. ' : '';
    warning += 'Higher risk of hypotension in young patients';
  }

  return {
    drug: 'Propofol',
    indication: indicationStr,
    dose: parseFloat(dose.toFixed(1)),
    unit,
    perKg,
    warning,
    dilution: '10 mg/mL',
    route: 'IV'
  };
};

/**
 * SUCCINYLCHOLINE DOSING (Pediatric)
 * IV: 2 mg/kg (infants), 1 mg/kg (children)
 * IM: 4-5 mg/kg
 */
export const calculatePediatricSuccinylcholine = (
  patient: PediatricPatient,
  route: 'iv' | 'im'
): DrugDose => {
  const ageYears = ageInYears(patient.age, patient.ageUnit);
  const category = getAgeCategory(ageYears);
  
  let perKg = 0;
  let maxDose = 0;
  let warning = 'Consider atropine pretreatment to prevent bradycardia';
  let routeStr = route.toUpperCase();

  if (route === 'iv') {
    // Infants need higher dose due to larger ECF
    perKg = (category === 'infant' || category === 'neonate') ? 2 : 1; // mg/kg
    maxDose = Math.min(patient.weight * perKg, 150); // max 150mg
  } else {
    perKg = 4; // mg/kg IM
    maxDose = Math.min(patient.weight * perKg, 150);
    warning += '. IM route for emergency when no IV access';
  }

  if (ageYears < 0.077) { // neonate
    warning += '. Use with extreme caution in neonates';
  }

  if (ageYears < 5) {
    warning += '. Higher risk of bradycardia in children < 5 years';
  }

  return {
    drug: 'Succinylcholine',
    indication: `${routeStr} rapid sequence intubation`,
    dose: parseFloat(maxDose.toFixed(1)),
    unit: 'mg',
    perKg,
    absoluteMax: 150,
    warning,
    dilution: routeStr === 'IV' ? '20 mg/mL' : '50 mg/mL',
    route: routeStr
  };
};