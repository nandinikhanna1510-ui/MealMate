'use client';

import { UserPreferences, FAMILY_SIZE_OPTIONS, NUTRITION_OPTIONS } from '@/types';
import { Allergen, ALLERGEN_LIST } from '@/data/recipes';

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onFamilySizeChange: (size: number) => void;
  onNutritionChange: (pref: UserPreferences['nutritionPreference']) => void;
  onAllergenToggle: (allergen: Allergen) => void;
  onClearAllergens: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesPanel({
  preferences,
  onFamilySizeChange,
  onNutritionChange,
  onAllergenToggle,
  onClearAllergens,
  isOpen,
  onClose,
}: PreferencesPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Preferences</h2>
              <p className="text-purple-100 text-sm">Customize your meal planning experience</p>
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Family Size */}
          <div className="tour-family-size">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> Family Size
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Ingredient quantities will be scaled based on your family size
            </p>
            <div className="grid grid-cols-4 gap-2">
              {FAMILY_SIZE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => onFamilySizeChange(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    preferences.familySize === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition Preference */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🥗</span> Nutrition Goal
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Filter recipes based on your dietary goals
            </p>
            <div className="grid grid-cols-2 gap-2">
              {NUTRITION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => onNutritionChange(option.value as UserPreferences['nutritionPreference'])}
                  className={`px-4 py-3 rounded-lg text-left transition-all ${
                    preferences.nutritionPreference === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-xs ${
                    preferences.nutritionPreference === option.value
                      ? 'text-purple-200'
                      : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div className="tour-allergens">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>⚠️</span> Allergens to Avoid
              </h3>
              {preferences.allergens.length > 0 && (
                <button
                  onClick={onClearAllergens}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Recipes containing these items will be filtered out. Claude will also exclude these from your grocery order.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ALLERGEN_LIST.map(allergen => (
                <button
                  key={allergen.id}
                  onClick={() => onAllergenToggle(allergen.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    preferences.allergens.includes(allergen.id)
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <span>{allergen.icon}</span>
                  <span>{allergen.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
