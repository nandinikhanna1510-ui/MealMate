import { Recipe, Allergen } from '@/data/recipes';

export interface MealPlan {
  [day: string]: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snack?: Recipe;
  };
}

export interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  recipes: string[];
  hasAllergen?: boolean;
  allergenType?: Allergen[];
  isEdited?: boolean;
  isRemoved?: boolean;
  originalQuantity?: string;
}

export interface UserPreferences {
  // Basic Info
  diet: 'all' | 'vegetarian' | 'vegan' | 'non-vegetarian' | 'eggetarian';
  cuisines: string[];
  allergens: Allergen[];
  familySize: number;
  nutritionPreference: 'all' | 'low-carb' | 'high-protein' | 'balanced';

  // Extended Onboarding Fields
  healthGoals: HealthGoal[];
  cookingSkill: CookingSkill;
  budgetLevel: BudgetLevel;
  mealTiming: MealTiming;
  isOnboardingComplete: boolean;
}

export type HealthGoal =
  | 'weight-loss'
  | 'muscle-gain'
  | 'heart-health'
  | 'diabetes-friendly'
  | 'energy-boost'
  | 'gut-health'
  | 'general-wellness';

export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';

export type BudgetLevel = 'budget-friendly' | 'moderate' | 'premium';

export interface MealTiming {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snack: boolean;
}

// Cuisine options
export const CUISINE_OPTIONS = [
  { value: 'indian', label: 'Indian', icon: '🍛' },
  { value: 'chinese', label: 'Chinese', icon: '🥡' },
  { value: 'italian', label: 'Italian', icon: '🍝' },
  { value: 'mexican', label: 'Mexican', icon: '🌮' },
  { value: 'thai', label: 'Thai', icon: '🍜' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🥙' },
  { value: 'american', label: 'American', icon: '🍔' },
  { value: 'japanese', label: 'Japanese', icon: '🍱' },
] as const;

// Health goal options
export const HEALTH_GOAL_OPTIONS = [
  { value: 'weight-loss', label: 'Weight Loss', icon: '⚖️', description: 'Calorie-conscious meals' },
  { value: 'muscle-gain', label: 'Muscle Gain', icon: '💪', description: 'High protein recipes' },
  { value: 'heart-health', label: 'Heart Health', icon: '❤️', description: 'Low sodium, healthy fats' },
  { value: 'diabetes-friendly', label: 'Diabetes Friendly', icon: '🩺', description: 'Low glycemic options' },
  { value: 'energy-boost', label: 'Energy Boost', icon: '⚡', description: 'Complex carbs & nutrients' },
  { value: 'gut-health', label: 'Gut Health', icon: '🦠', description: 'Fiber-rich meals' },
  { value: 'general-wellness', label: 'General Wellness', icon: '🌿', description: 'Balanced nutrition' },
] as const;

// Cooking skill options
export const COOKING_SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner', icon: '🌱', description: 'Simple 15-30 min recipes' },
  { value: 'intermediate', label: 'Intermediate', icon: '👨‍🍳', description: 'Moderate complexity' },
  { value: 'advanced', label: 'Advanced', icon: '⭐', description: 'Complex techniques welcome' },
] as const;

// Budget level options
export const BUDGET_OPTIONS = [
  { value: 'budget-friendly', label: 'Budget Friendly', icon: '💰', description: 'Economical ingredients' },
  { value: 'moderate', label: 'Moderate', icon: '💳', description: 'Balanced cost' },
  { value: 'premium', label: 'Premium', icon: '💎', description: 'Quality ingredients' },
] as const;

// Diet options
export const DIET_OPTIONS = [
  { value: 'all', label: 'All', icon: '🍽️', description: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬', description: 'No meat' },
  { value: 'vegan', label: 'Vegan', icon: '🌱', description: 'Plant-based only' },
  { value: 'non-vegetarian', label: 'Non-Veg', icon: '🍖', description: 'Includes meat' },
  { value: 'eggetarian', label: 'Eggetarian', icon: '🥚', description: 'Vegetarian + eggs' },
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const FAMILY_SIZE_OPTIONS = [
  { value: 1, label: '1 person' },
  { value: 2, label: '2 people' },
  { value: 3, label: '3 people' },
  { value: 4, label: '4 people' },
  { value: 5, label: '5 people' },
  { value: 6, label: '6 people' },
  { value: 8, label: '8 people' },
] as const;

export const NUTRITION_OPTIONS = [
  { value: 'all', label: 'All', description: 'No filter' },
  { value: 'low-carb', label: 'Low Carb', description: '< 20g carbs/serving' },
  { value: 'high-protein', label: 'High Protein', description: '> 20g protein/serving' },
  { value: 'balanced', label: 'Balanced', description: 'Balanced macros' },
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
export type MealType = typeof MEAL_TYPES[number];
