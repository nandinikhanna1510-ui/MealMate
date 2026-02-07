'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recipe, Allergen, scaleIngredients } from '@/data/recipes';
import { MealPlan, GroceryItem, MealType, UserPreferences } from '@/types';

const STORAGE_KEY = 'meal-planner-data';
const DATE_RANGE_KEY = 'meal-planner-date-range';

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to get day name from date
function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Helper to format date for display
function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Generate dates between start and end
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Get default date range (this week starting from today or Monday)
function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today
  const startDate = new Date(today);

  // End date is 6 days from start (7 days total)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return { startDate, endDate };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PlanDay {
  date: Date;
  dateKey: string;
  dayName: string;
  displayDate: string;
  isToday: boolean;
  isPast: boolean;
}

export function useMealPlan() {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Load meal plan
    const savedPlan = localStorage.getItem(STORAGE_KEY);
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        setMealPlan(parsed);
      } catch (e) {
        console.error('Failed to parse saved meal plan', e);
      }
    }

    // Load date range
    const savedRange = localStorage.getItem(DATE_RANGE_KEY);
    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        setDateRange({
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
        });
      } catch (e) {
        console.error('Failed to parse saved date range', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever meal plan changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealPlan));
    }
  }, [mealPlan, isLoaded]);

  // Save date range whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(DATE_RANGE_KEY, JSON.stringify({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      }));
    }
  }, [dateRange, isLoaded]);

  // Generate plan days from date range
  const planDays = useMemo((): PlanDay[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return getDateRange(dateRange.startDate, dateRange.endDate).map(date => ({
      date,
      dateKey: formatDate(date),
      dayName: getDayName(date),
      displayDate: formatDisplayDate(date),
      isToday: formatDate(date) === formatDate(today),
      isPast: date < today,
    }));
  }, [dateRange]);

  const addMeal = useCallback((dateKey: string, mealType: MealType, recipe: Recipe) => {
    setMealPlan(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [mealType]: recipe,
      },
    }));
  }, []);

  const removeMeal = useCallback((dateKey: string, mealType: MealType) => {
    setMealPlan(prev => {
      const newPlan = { ...prev };
      if (newPlan[dateKey]) {
        const dayPlan = { ...newPlan[dateKey] };
        delete dayPlan[mealType];
        newPlan[dateKey] = dayPlan;
      }
      return newPlan;
    });
  }, []);

  const clearMealPlan = useCallback(() => {
    setMealPlan({});
  }, []);

  const updateDateRange = useCallback((startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  }, []);

  const setQuickRange = useCallback((type: 'week' | 'two-weeks' | 'month') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);

    switch (type) {
      case 'week':
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'two-weeks':
        endDate.setDate(endDate.getDate() + 13);
        break;
      case 'month':
        endDate.setDate(endDate.getDate() + 29);
        break;
    }

    setDateRange({ startDate: today, endDate });
  }, []);

  // Updated to support family size scaling
  const getGroceryList = useCallback((familySize: number = 2): GroceryItem[] => {
    const groceryMap = new Map<string, GroceryItem>();

    // Only include meals within current date range
    planDays.forEach(day => {
      const dayMeals = mealPlan[day.dateKey];
      if (dayMeals) {
        Object.values(dayMeals).forEach(recipe => {
          if (recipe) {
            // Scale ingredients based on family size
            const scaledIngredients = scaleIngredients(recipe, familySize);

            scaledIngredients.forEach(ingredient => {
              const key = ingredient.name.toLowerCase();
              if (groceryMap.has(key)) {
                const existing = groceryMap.get(key)!;
                if (!existing.recipes.includes(recipe.name)) {
                  existing.recipes.push(recipe.name);
                }
                // Try to add quantities (simplified)
                const existingQty = parseFloat(existing.quantity);
                const newQty = parseFloat(ingredient.quantity);
                if (!isNaN(existingQty) && !isNaN(newQty) && existing.unit === ingredient.unit) {
                  existing.quantity = (existingQty + newQty).toFixed(1);
                }
              } else {
                groceryMap.set(key, {
                  name: ingredient.name,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  category: ingredient.category,
                  recipes: [recipe.name],
                });
              }
            });
          }
        });
      }
    });

    return Array.from(groceryMap.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  }, [mealPlan, planDays]);

  const getTotalMeals = useCallback((): number => {
    let count = 0;
    planDays.forEach(day => {
      const dayMeals = mealPlan[day.dateKey];
      if (dayMeals) {
        count += Object.values(dayMeals).filter(Boolean).length;
      }
    });
    return count;
  }, [mealPlan, planDays]);

  // Updated to include allergen warnings and family size
  const generateOrderPrompt = useCallback((preferences: UserPreferences): string => {
    const groceryList = getGroceryList(preferences.familySize);

    if (groceryList.length === 0) {
      return '';
    }

    const itemsByCategory = groceryList.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

    // Format date range
    const dateRangeStr = `${formatDisplayDate(dateRange.startDate)} - ${formatDisplayDate(dateRange.endDate)}`;

    let prompt = `Hi Claude! I need to order groceries from Swiggy Instamart for my meal plan (${dateRangeStr}) for ${preferences.familySize} ${preferences.familySize === 1 ? 'person' : 'people'}.\n\n`;

    // Add allergen warning if user has allergens
    if (preferences.allergens.length > 0) {
      prompt += `⚠️ **IMPORTANT - ALLERGEN ALERT:**\n`;
      prompt += `I am allergic to: **${preferences.allergens.join(', ')}**\n`;
      prompt += `Please ensure NONE of the products contain these ingredients. Check product labels and descriptions carefully. If unsure about any item, skip it and let me know.\n\n`;
    }

    prompt += `**Shopping List:**\n\n`;

    Object.entries(itemsByCategory).forEach(([category, items]) => {
      prompt += `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
      items.forEach(item => {
        prompt += `- ${item.name}: ${item.quantity} ${item.unit}\n`;
      });
      prompt += '\n';
    });

    prompt += `\n**Instructions:**\n`;
    prompt += `1. Find these items on Swiggy Instamart\n`;
    prompt += `2. Choose good quality brands\n`;
    if (preferences.allergens.length > 0) {
      prompt += `3. Double-check NO items contain: ${preferences.allergens.join(', ')}\n`;
      prompt += `4. Let me review the cart before placing the order\n`;
    } else {
      prompt += `3. Let me review the cart before placing the order\n`;
    }

    return prompt;
  }, [getGroceryList, dateRange]);

  return {
    mealPlan,
    isLoaded,
    planDays,
    dateRange,
    addMeal,
    removeMeal,
    clearMealPlan,
    updateDateRange,
    setQuickRange,
    getGroceryList,
    getTotalMeals,
    generateOrderPrompt,
  };
}
