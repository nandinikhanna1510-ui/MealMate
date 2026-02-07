'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, HealthGoal, CookingSkill, BudgetLevel, MealTiming } from '@/types';
import { Allergen } from '@/data/recipes';

const STORAGE_KEY = 'meal-planner-preferences';

const defaultPreferences: UserPreferences = {
  diet: 'all',
  cuisines: [],
  allergens: [],
  familySize: 2,
  nutritionPreference: 'all',
  healthGoals: ['general-wellness'],
  cookingSkill: 'intermediate',
  budgetLevel: 'moderate',
  mealTiming: {
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  },
  isOnboardingComplete: false,
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved preferences', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isLoaded]);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const setFamilySize = useCallback((size: number) => {
    setPreferences(prev => ({ ...prev, familySize: size }));
  }, []);

  const setDiet = useCallback((diet: UserPreferences['diet']) => {
    setPreferences(prev => ({ ...prev, diet }));
  }, []);

  const setNutritionPreference = useCallback((pref: UserPreferences['nutritionPreference']) => {
    setPreferences(prev => ({ ...prev, nutritionPreference: pref }));
  }, []);

  const toggleAllergen = useCallback((allergen: Allergen) => {
    setPreferences(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  }, []);

  const clearAllergens = useCallback(() => {
    setPreferences(prev => ({ ...prev, allergens: [] }));
  }, []);

  const toggleCuisine = useCallback((cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine],
    }));
  }, []);

  const toggleHealthGoal = useCallback((goal: HealthGoal) => {
    setPreferences(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal],
    }));
  }, []);

  const setCookingSkill = useCallback((skill: CookingSkill) => {
    setPreferences(prev => ({ ...prev, cookingSkill: skill }));
  }, []);

  const setBudgetLevel = useCallback((budget: BudgetLevel) => {
    setPreferences(prev => ({ ...prev, budgetLevel: budget }));
  }, []);

  const setMealTiming = useCallback((timing: MealTiming) => {
    setPreferences(prev => ({ ...prev, mealTiming: timing }));
  }, []);

  const toggleMealTime = useCallback((mealType: keyof MealTiming) => {
    setPreferences(prev => ({
      ...prev,
      mealTiming: {
        ...prev.mealTiming,
        [mealType]: !prev.mealTiming[mealType],
      },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setPreferences(prev => ({ ...prev, isOnboardingComplete: true }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  return {
    preferences,
    isLoaded,
    updatePreferences,
    setFamilySize,
    setDiet,
    setNutritionPreference,
    toggleAllergen,
    clearAllergens,
    toggleCuisine,
    toggleHealthGoal,
    setCookingSkill,
    setBudgetLevel,
    setMealTiming,
    toggleMealTime,
    completeOnboarding,
    resetPreferences,
  };
}
