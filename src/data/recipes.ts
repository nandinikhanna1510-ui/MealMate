// Main Recipe Types and Combined Database
export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: 'vegetables' | 'fruits' | 'dairy' | 'protein' | 'grains' | 'spices' | 'pantry' | 'other';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: 'indian' | 'italian' | 'chinese' | 'mexican' | 'continental' | 'thai';
  diet: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'eggetarian';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  instructions: string[];
  image: string;
  tags: string[];
  // Nutritional info (per serving)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  nutritionCategory: 'low-carb' | 'high-protein' | 'balanced';
  allergens: Allergen[];
}

// Allergen types
export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'nuts'
  | 'peanuts'
  | 'eggs'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export const ALLERGEN_LIST: { id: Allergen; label: string; icon: string }[] = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'nuts', label: 'Tree Nuts', icon: '🥜' },
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'sesame', label: 'Sesame', icon: '🌱' },
];

// Import all recipe categories
import { breakfastRecipes } from './recipes-breakfast';
import { lunchRecipes } from './recipes-lunch';
import { dinnerRecipes } from './recipes-dinner';
import { snackRecipes } from './recipes-snacks';

// Combined recipes array
export const recipes: Recipe[] = [
  ...breakfastRecipes,
  ...lunchRecipes,
  ...dinnerRecipes,
  ...snackRecipes,
];

// Helper functions
export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find(recipe => recipe.id === id);
}

export function getRecipesByMealType(mealType: Recipe['mealType']): Recipe[] {
  return recipes.filter(recipe => recipe.mealType === mealType);
}

export function getRecipesByCuisine(cuisine: Recipe['cuisine']): Recipe[] {
  return recipes.filter(recipe => recipe.cuisine === cuisine);
}

export function getRecipesByDiet(diet: Recipe['diet']): Recipe[] {
  return recipes.filter(recipe => recipe.diet === diet);
}

export function getRecipesByNutrition(category: Recipe['nutritionCategory']): Recipe[] {
  return recipes.filter(recipe => recipe.nutritionCategory === category);
}

export function getRecipesWithoutAllergens(allergens: Allergen[]): Recipe[] {
  return recipes.filter(recipe =>
    !recipe.allergens.some(a => allergens.includes(a))
  );
}

export function searchRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.description.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Scale ingredients based on servings
export function scaleIngredients(recipe: Recipe, targetServings: number): Ingredient[] {
  const ratio = targetServings / recipe.servings;
  return recipe.ingredients.map(ing => {
    const numericQty = parseFloat(ing.quantity);
    if (!isNaN(numericQty)) {
      const scaledQty = numericQty * ratio;
      const formatted = scaledQty % 1 === 0 ? scaledQty.toString() : scaledQty.toFixed(1);
      return { ...ing, quantity: formatted };
    }
    return ing;
  });
}
