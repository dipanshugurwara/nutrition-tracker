/**
 * Calorie and protein estimation from body metrics.
 * Uses Mifflin-St Jeor equation for BMR, activity multiplier for TDEE.
 */

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light 1–3 days/week
  moderate: 1.55,      // Moderate 3–5 days/week
  active: 1.725,       // Hard 6–7 days/week
  very_active: 1.9,    // Very hard, physical job
};

/** Protein grams per kg body weight by activity level */
const PROTEIN_PER_KG: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.4,
  moderate: 1.6,
  active: 1.8,
  very_active: 2.0,
};

/**
 * BMR via Mifflin-St Jeor (kcal/day).
 * weight_kg, height_cm, age in years.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * TDEE (maintenance calories) = BMR * activity multiplier.
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activity: ActivityLevel
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/**
 * Suggested daily protein (grams) = weight_kg * factor.
 */
export function calculateProtein(weightKg: number, activity: ActivityLevel): number {
  return Math.round(weightKg * PROTEIN_PER_KG[activity]);
}

export function getCalculatedTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activity: ActivityLevel
): { targetCalories: number; targetProtein: number } {
  return {
    targetCalories: calculateTDEE(weightKg, heightCm, age, gender, activity),
    targetProtein: calculateProtein(weightKg, activity),
  };
}
