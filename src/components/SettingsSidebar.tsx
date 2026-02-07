'use client';

import { useState } from 'react';
import {
  UserPreferences,
  DIET_OPTIONS,
  CUISINE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  COOKING_SKILL_OPTIONS,
  BUDGET_OPTIONS,
  FAMILY_SIZE_OPTIONS,
  HealthGoal,
  CookingSkill,
  BudgetLevel,
  MealTiming,
} from '@/types';
import { Allergen, ALLERGEN_LIST } from '@/data/recipes';

interface SettingsSidebarProps {
  preferences: UserPreferences;
  onFamilySizeChange: (size: number) => void;
  onDietChange: (diet: UserPreferences['diet']) => void;
  onAllergenToggle: (allergen: Allergen) => void;
  onClearAllergens: () => void;
  onCuisineToggle: (cuisine: string) => void;
  onHealthGoalToggle: (goal: HealthGoal) => void;
  onCookingSkillChange: (skill: CookingSkill) => void;
  onBudgetChange: (budget: BudgetLevel) => void;
  onMealTimeToggle: (mealType: keyof MealTiming) => void;
  onCompleteOnboarding: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type SettingsSection = 'household' | 'diet' | 'health' | 'preferences' | 'meals';

export function SettingsSidebar({
  preferences,
  onFamilySizeChange,
  onDietChange,
  onAllergenToggle,
  onClearAllergens,
  onCuisineToggle,
  onHealthGoalToggle,
  onCookingSkillChange,
  onBudgetChange,
  onMealTimeToggle,
  onCompleteOnboarding,
  isCollapsed = false,
  onToggleCollapse,
}: SettingsSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<SettingsSection | null>('household');

  const toggleSection = (section: SettingsSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate completion percentage
  const completionScore = () => {
    let score = 0;
    if (preferences.familySize > 0) score += 20;
    if (preferences.diet !== 'all') score += 15;
    if (preferences.cuisines.length > 0) score += 15;
    if (preferences.healthGoals.length > 0) score += 20;
    if (preferences.cookingSkill) score += 15;
    if (preferences.budgetLevel) score += 15;
    return score;
  };

  const completion = completionScore();

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] flex flex-col items-center py-4 gap-3">
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
          title="Expand Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">
          <span>{preferences.familySize}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">
          {preferences.diet === 'vegetarian' ? '🥬' : preferences.diet === 'vegan' ? '🌱' : '🍽️'}
        </div>
        {preferences.allergens.length > 0 && (
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-sm font-medium text-red-600">
            {preferences.allergens.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Your Preferences</h2>
              <p className="text-xs text-gray-500">Personalize your meal plan</p>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Completion Progress */}
        {!preferences.isOnboardingComplete && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-teal-700">Profile Completion</span>
              <span className="text-sm font-bold text-teal-600">{completion}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            {completion >= 80 && (
              <button
                onClick={onCompleteOnboarding}
                className="mt-2 w-full py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
              >
                Complete Setup
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Household Section */}
        <SettingsAccordion
          title="Household"
          icon="👨‍👩‍👧‍👦"
          isExpanded={expandedSection === 'household'}
          onToggle={() => toggleSection('household')}
          badge={`${preferences.familySize} ${preferences.familySize === 1 ? 'person' : 'people'}`}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Portions will be scaled for your household</p>
            <div className="grid grid-cols-4 gap-2">
              {FAMILY_SIZE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => onFamilySizeChange(option.value)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    preferences.familySize === option.value
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.value}
                </button>
              ))}
            </div>
          </div>
        </SettingsAccordion>

        {/* Diet Section */}
        <SettingsAccordion
          title="Dietary Style"
          icon="🥗"
          isExpanded={expandedSection === 'diet'}
          onToggle={() => toggleSection('diet')}
          badge={DIET_OPTIONS.find(d => d.value === preferences.diet)?.label || 'All'}
        >
          <div className="space-y-4">
            {/* Diet Type */}
            <div>
              <p className="text-xs text-gray-500 mb-2">What's your diet preference?</p>
              <div className="grid grid-cols-2 gap-2">
                {DIET_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onDietChange(option.value as UserPreferences['diet'])}
                    className={`p-2 rounded-lg text-left text-sm transition-all ${
                      preferences.diet === option.value
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Allergens to avoid</p>
                {preferences.allergens.length > 0 && (
                  <button
                    onClick={onClearAllergens}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_LIST.map(allergen => (
                  <button
                    key={allergen.id}
                    onClick={() => onAllergenToggle(allergen.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      preferences.allergens.includes(allergen.id)
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <span>{allergen.icon}</span>
                    <span>{allergen.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsAccordion>

        {/* Health Goals Section */}
        <SettingsAccordion
          title="Health Goals"
          icon="🎯"
          isExpanded={expandedSection === 'health'}
          onToggle={() => toggleSection('health')}
          badge={preferences.healthGoals.length > 0 ? `${preferences.healthGoals.length} selected` : 'Set goals'}
        >
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Select your health priorities (choose multiple)</p>
            {HEALTH_GOAL_OPTIONS.map(goal => (
              <button
                key={goal.value}
                onClick={() => onHealthGoalToggle(goal.value as HealthGoal)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  preferences.healthGoals.includes(goal.value as HealthGoal)
                    ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{goal.label}</div>
                    <div className="text-xs text-gray-500">{goal.description}</div>
                  </div>
                  {preferences.healthGoals.includes(goal.value as HealthGoal) && (
                    <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </SettingsAccordion>

        {/* Preferences Section */}
        <SettingsAccordion
          title="Cooking & Budget"
          icon="👨‍🍳"
          isExpanded={expandedSection === 'preferences'}
          onToggle={() => toggleSection('preferences')}
          badge={COOKING_SKILL_OPTIONS.find(s => s.value === preferences.cookingSkill)?.label || 'Set'}
        >
          <div className="space-y-4">
            {/* Cooking Skill */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Your cooking experience</p>
              <div className="space-y-2">
                {COOKING_SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill.value}
                    onClick={() => onCookingSkillChange(skill.value as CookingSkill)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      preferences.cookingSkill === skill.value
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{skill.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{skill.label}</div>
                        <div className="text-xs text-gray-500">{skill.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Weekly grocery budget</p>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map(budget => (
                  <button
                    key={budget.value}
                    onClick={() => onBudgetChange(budget.value as BudgetLevel)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      preferences.budgetLevel === budget.value
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{budget.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{budget.label}</div>
                        <div className="text-xs text-gray-500">{budget.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisines */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Preferred cuisines</p>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map(cuisine => (
                  <button
                    key={cuisine.value}
                    onClick={() => onCuisineToggle(cuisine.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      preferences.cuisines.includes(cuisine.value)
                        ? 'bg-teal-100 text-teal-700 border-2 border-teal-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <span>{cuisine.icon}</span>
                    <span>{cuisine.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SettingsAccordion>

        {/* Meal Timing Section */}
        <SettingsAccordion
          title="Meals to Plan"
          icon="🍽️"
          isExpanded={expandedSection === 'meals'}
          onToggle={() => toggleSection('meals')}
          badge={`${Object.values(preferences.mealTiming).filter(Boolean).length} meals`}
        >
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Which meals do you want to plan?</p>
            {[
              { key: 'breakfast' as const, label: 'Breakfast', icon: '🌅', time: '7:00 - 9:00 AM' },
              { key: 'lunch' as const, label: 'Lunch', icon: '☀️', time: '12:00 - 2:00 PM' },
              { key: 'dinner' as const, label: 'Dinner', icon: '🌙', time: '7:00 - 9:00 PM' },
              { key: 'snack' as const, label: 'Snacks', icon: '🍎', time: 'Anytime' },
            ].map(meal => (
              <button
                key={meal.key}
                onClick={() => onMealTimeToggle(meal.key)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  preferences.mealTiming[meal.key]
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meal.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{meal.label}</div>
                    <div className="text-xs text-gray-500">{meal.time}</div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-all flex items-center ${
                      preferences.mealTiming[meal.key] ? 'bg-teal-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SettingsAccordion>
      </div>

      {/* Footer Summary */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-1.5">
          {preferences.familySize > 0 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {preferences.familySize} {preferences.familySize === 1 ? 'person' : 'people'}
            </span>
          )}
          {preferences.diet !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {DIET_OPTIONS.find(d => d.value === preferences.diet)?.label}
            </span>
          )}
          {preferences.allergens.length > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {preferences.allergens.length} allergen{preferences.allergens.length !== 1 ? 's' : ''}
            </span>
          )}
          {preferences.healthGoals.length > 0 && (
            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
              {preferences.healthGoals.length} goal{preferences.healthGoals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Accordion Component
interface SettingsAccordionProps {
  title: string;
  icon: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsAccordion({
  title,
  icon,
  badge,
  isExpanded,
  onToggle,
  children,
}: SettingsAccordionProps) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-gray-900 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {badge}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
