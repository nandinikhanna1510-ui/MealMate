'use client';

import { useState, useMemo } from 'react';
import { recipes, Recipe } from '@/data/recipes';
import { MealType } from '@/types';
import { RecipeCard } from './RecipeCard';

interface AddMealModalProps {
  day: string;
  mealType: MealType;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export function AddMealModal({ day, mealType, onClose, onSelectRecipe }: AddMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-filter recipes for the meal type
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(recipe => {
        // Match the meal type first
        const matchesMealType = recipe.mealType === mealType;

        // Then apply search
        const matchesSearch = searchQuery === '' ||
          recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesMealType && matchesSearch;
      });
  }, [mealType, searchQuery]);

  // Also show other recipes if user is searching
  const otherRecipes = useMemo(() => {
    if (searchQuery === '') return [];
    return recipes.filter(recipe => {
      const matchesSearch =
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch && recipe.mealType !== mealType;
    });
  }, [mealType, searchQuery]);

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: '🌅 Breakfast',
    lunch: '☀️ Lunch',
    dinner: '🌙 Dinner',
    snack: '🍿 Snack',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add {mealTypeLabels[mealType]}</h2>
              <p className="text-green-100 text-sm">for {day}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={`Search ${mealType} recipes...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-green-200 focus:bg-white/20 focus:border-white/40 transition-all outline-none"
            />
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecipes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Recipes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{recipe.image}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          {recipe.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{recipe.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                          <span className="capitalize">• {recipe.diet}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherRecipes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Other Matching Recipes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{recipe.image}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          {recipe.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{recipe.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                          <span className="capitalize">• {recipe.mealType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredRecipes.length === 0 && otherRecipes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
