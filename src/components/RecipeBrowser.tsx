'use client';

import { useState, useMemo } from 'react';
import { recipes, Recipe } from '@/data/recipes';
import { RecipeCard } from './RecipeCard';
import { UserPreferences, NUTRITION_OPTIONS, CUISINE_OPTIONS, DIET_OPTIONS } from '@/types';

interface RecipeBrowserProps {
  onAddToMeal: (recipe: Recipe) => void;
  onViewDetails: (recipe: Recipe) => void;
  userPreferences: UserPreferences;
}

export function RecipeBrowser({ onAddToMeal, onViewDetails, userPreferences }: RecipeBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedNutrition, setSelectedNutrition] = useState<string>(userPreferences.nutritionPreference);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const mealTypes = [
    { value: 'all', label: 'All Meals', icon: '🍽️' },
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '☀️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snacks', icon: '🍿' },
  ];

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = searchQuery === '' ||
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCuisine = selectedCuisine === 'all' || recipe.cuisine === selectedCuisine;
      const matchesDiet = selectedDiet === 'all' || recipe.diet === selectedDiet;
      const matchesMealType = selectedMealType === 'all' || recipe.mealType === selectedMealType;

      // Nutrition filter
      const matchesNutrition = selectedNutrition === 'all' || recipe.nutritionCategory === selectedNutrition;

      // Allergen filter - exclude recipes containing user's allergens
      const hasNoAllergens = userPreferences.allergens.length === 0 ||
        !recipe.allergens.some(a => userPreferences.allergens.includes(a));

      return matchesSearch && matchesCuisine && matchesDiet && matchesMealType && matchesNutrition && hasNoAllergens;
    });
  }, [searchQuery, selectedCuisine, selectedDiet, selectedMealType, selectedNutrition, userPreferences.allergens]);

  const hasActiveAllergenFilter = userPreferences.allergens.length > 0;
  const hasActiveFilters = selectedCuisine !== 'all' || selectedDiet !== 'all' || selectedMealType !== 'all' || selectedNutrition !== 'all';

  const clearFilters = () => {
    setSelectedCuisine('all');
    setSelectedDiet('all');
    setSelectedMealType('all');
    setSelectedNutrition('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
          placeholder="Search by name, ingredients, or cuisine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all outline-none text-gray-900 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Meal Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {mealTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedMealType(type.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedMealType === type.value
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Cuisine Filter */}
        <div className="relative">
          <select
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
            className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all outline-none ${
              selectedCuisine !== 'all'
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <option value="all">All Cuisines</option>
            {CUISINE_OPTIONS.map(cuisine => (
              <option key={cuisine.value} value={cuisine.value}>
                {cuisine.icon} {cuisine.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Diet Filter */}
        <div className="relative">
          <select
            value={selectedDiet}
            onChange={(e) => setSelectedDiet(e.target.value)}
            className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all outline-none ${
              selectedDiet !== 'all'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <option value="all">All Diets</option>
            {DIET_OPTIONS.map(diet => (
              <option key={diet.value} value={diet.value}>
                {diet.icon} {diet.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Nutrition Filter */}
        <div className="relative">
          <select
            value={selectedNutrition}
            onChange={(e) => setSelectedNutrition(e.target.value)}
            className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all outline-none ${
              selectedNutrition !== 'all'
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {NUTRITION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.value === 'all' ? 'All Nutrition' : option.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
            }`}
            title="Compact view"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Filters Info */}
      {hasActiveAllergenFilter && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-600">⚠️</span>
          <span className="text-sm text-amber-800">
            Hiding recipes with: <span className="font-medium">{userPreferences.allergens.join(', ')}</span>
          </span>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filteredRecipes.length}</span> recipes found
        </div>
        <div className="text-sm text-gray-500">
          Scaled for <span className="font-medium text-teal-600">{userPreferences.familySize} {userPreferences.familySize === 1 ? 'person' : 'people'}</span>
        </div>
      </div>

      {/* Recipe Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe, index) => (
            <div key={recipe.id} className={index === 0 ? 'tour-recipe-card' : ''}>
              <RecipeCard
                recipe={recipe}
                onAddToMeal={onAddToMeal}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRecipes.map((recipe, index) => (
            <div key={recipe.id} className={index === 0 ? 'tour-recipe-card' : ''}>
              <RecipeCard
                recipe={recipe}
                onAddToMeal={onAddToMeal}
                onViewDetails={onViewDetails}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {filteredRecipes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
