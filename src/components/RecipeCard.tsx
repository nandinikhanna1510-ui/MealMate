'use client';

import { useState } from 'react';
import { Recipe } from '@/data/recipes';
import { getRecipeImageUrl, getPlaceholderGradient } from '@/lib/recipe-images';

interface RecipeCardProps {
  recipe: Recipe;
  onAddToMeal?: (recipe: Recipe) => void;
  onViewDetails?: (recipe: Recipe) => void;
  compact?: boolean;
}

export function RecipeCard({ recipe, onAddToMeal, onViewDetails, compact = false }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const dietColors = {
    vegetarian: 'bg-green-100 text-green-800 border-green-200',
    vegan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'non-vegetarian': 'bg-red-100 text-red-800 border-red-200',
    eggetarian: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const difficultyColors = {
    easy: 'text-green-600',
    medium: 'text-amber-600',
    hard: 'text-red-600',
  };

  const imageUrl = getRecipeImageUrl(recipe.id, recipe.mealType, recipe.cuisine, {
    width: compact ? 80 : 400,
    height: compact ? 80 : 250,
  });

  const placeholderStyle = {
    background: getPlaceholderGradient(recipe.mealType),
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-teal-200">
        <div className="flex items-center gap-3">
          {/* Compact Image */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
            {!imageLoaded && !imageError && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={placeholderStyle}
              >
                <span className="text-xl">{recipe.image}</span>
              </div>
            )}
            {imageError ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={placeholderStyle}
              >
                <span className="text-xl">{recipe.image}</span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={recipe.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">{recipe.name}</h4>
            <p className="text-xs text-gray-500">{recipe.prepTime + recipe.cookTime} mins</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all duration-200 flex flex-col group">
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        {/* Placeholder while loading */}
        {!imageLoaded && !imageError && (
          <div
            className="absolute inset-0 flex items-center justify-center animate-pulse"
            style={placeholderStyle}
          >
            <span className="text-6xl opacity-50">{recipe.image}</span>
          </div>
        )}

        {/* Fallback if image fails */}
        {imageError ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={placeholderStyle}
          >
            <span className="text-6xl">{recipe.image}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={recipe.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Quick add button on hover */}
        {onAddToMeal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToMeal(recipe);
            }}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-teal-50"
          >
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Diet badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm bg-white/90 ${dietColors[recipe.diet]}`}>
            {recipe.diet}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Cuisine & Nutrition Tags */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {recipe.cuisine}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
            {recipe.nutritionCategory}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-teal-700 transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{recipe.description}</p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{recipe.servings}</span>
          </div>
          <span className={`${difficultyColors[recipe.difficulty]} font-medium capitalize`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Nutrition Quick View */}
        <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg text-xs">
          <div className="flex-1 text-center">
            <div className="font-bold text-gray-900">{recipe.calories}</div>
            <div className="text-gray-500">kcal</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="font-bold text-teal-600">{recipe.protein}g</div>
            <div className="text-gray-500">protein</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="font-bold text-amber-600">{recipe.carbs}g</div>
            <div className="text-gray-500">carbs</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="font-bold text-purple-600">{recipe.fat}g</div>
            <div className="text-gray-500">fat</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(recipe)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              View Details
            </button>
          )}
          {onAddToMeal && (
            <button
              onClick={() => onAddToMeal(recipe)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200"
            >
              Add to Meal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
