'use client';

import { Recipe } from '@/data/recipes';
import { MealType, DAYS_OF_WEEK } from '@/types';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToMeal: (day: string, mealType: MealType) => void;
}

export function RecipeModal({ recipe, onClose, onAddToMeal }: RecipeModalProps) {
  const dietColors = {
    vegetarian: 'bg-green-100 text-green-800',
    vegan: 'bg-emerald-100 text-emerald-800',
    'non-vegetarian': 'bg-red-100 text-red-800',
    eggetarian: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center">
            <span className="text-7xl block mb-4">{recipe.image}</span>
            <h2 className="text-2xl font-bold text-gray-900">{recipe.name}</h2>
            <p className="text-gray-600 mt-2">{recipe.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Tags & Stats */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${dietColors[recipe.diet]}`}>
              {recipe.diet}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {recipe.cuisine}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {recipe.mealType}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              ⏱️ {recipe.prepTime + recipe.cookTime} min
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              👥 {recipe.servings} servings
            </span>
            {recipe.calories && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                🔥 {recipe.calories} cal
              </span>
            )}
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span>🥗</span> Ingredients
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">
                    {ing.name} - {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span>👨‍🍳</span> Instructions
            </h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full text-sm flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Add to Meal Plan */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span>📅</span> Add to Meal Plan
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => onAddToMeal(day, recipe.mealType)}
                  className="px-2 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
