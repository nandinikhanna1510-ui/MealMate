'use client';

import { useState } from 'react';
import { MealPlan, MEAL_TYPES, MealType } from '@/types';
import { Recipe } from '@/data/recipes';
import { PlanDay, DateRange } from '@/hooks/useMealPlan';

interface MealCalendarProps {
  mealPlan: MealPlan;
  planDays: PlanDay[];
  dateRange: DateRange;
  onRemoveMeal: (dateKey: string, mealType: MealType) => void;
  onAddMealClick: (dateKey: string, mealType: MealType) => void;
  onUpdateDateRange: (startDate: Date, endDate: Date) => void;
  onSetQuickRange: (type: 'week' | 'two-weeks' | 'month') => void;
}

export function MealCalendar({
  mealPlan,
  planDays,
  dateRange,
  onRemoveMeal,
  onAddMealClick,
  onUpdateDateRange,
  onSetQuickRange,
}: MealCalendarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    dateRange.startDate.toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    dateRange.endDate.toISOString().split('T')[0]
  );

  const mealTypeLabels: Record<MealType, { label: string; icon: string }> = {
    breakfast: { label: 'Breakfast', icon: '🌅' },
    lunch: { label: 'Lunch', icon: '☀️' },
    dinner: { label: 'Dinner', icon: '🌙' },
    snack: { label: 'Snack', icon: '🍿' },
  };

  const getMealForSlot = (dateKey: string, mealType: MealType): Recipe | undefined => {
    return mealPlan[dateKey]?.[mealType];
  };

  const handleApplyDateRange = () => {
    onUpdateDateRange(new Date(tempStartDate), new Date(tempEndDate));
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days difference
  const daysDiff = Math.ceil(
    (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Date Range Controls */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📅</span>
              Meal Plan
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              {formatDateForDisplay(dateRange.startDate)} - {formatDateForDisplay(dateRange.endDate)}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {daysDiff} days
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Quick Range Buttons */}
            <div className="flex gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => onSetQuickRange('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  daysDiff === 7
                    ? 'bg-white text-teal-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => onSetQuickRange('two-weeks')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  daysDiff === 14
                    ? 'bg-white text-teal-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                2 Weeks
              </button>
              <button
                onClick={() => onSetQuickRange('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  daysDiff === 30
                    ? 'bg-white text-teal-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Month
              </button>
            </div>

            {/* Custom Date Picker Button */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Picker Dropdown */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-white rounded-xl text-gray-900">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  min={tempStartDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyDateRange}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: `${Math.max(800, planDays.length * 120)}px` }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-3 text-left text-sm font-semibold text-gray-600 w-24 sticky left-0 bg-gray-50 z-10">
                Meal
              </th>
              {planDays.map(day => (
                <th
                  key={day.dateKey}
                  className={`p-3 text-center text-sm font-semibold min-w-[100px] ${
                    day.isToday
                      ? 'bg-teal-50 text-teal-700'
                      : day.isPast
                      ? 'text-gray-400 bg-gray-50'
                      : 'text-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs uppercase tracking-wide opacity-70">
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span className={`font-bold ${day.isToday ? 'text-teal-600' : ''}`}>
                      {day.date.getDate()}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {day.date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.5 bg-teal-500 text-white rounded-full text-[9px] font-bold uppercase">
                        Today
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(mealType => (
              <tr key={mealType} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-3 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mealTypeLabels[mealType].icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {mealTypeLabels[mealType].label}
                    </span>
                  </div>
                </td>
                {planDays.map(day => {
                  const meal = getMealForSlot(day.dateKey, mealType);
                  return (
                    <td
                      key={`${day.dateKey}-${mealType}`}
                      className={`p-2 ${day.isToday ? 'bg-teal-50/30' : ''} ${day.isPast ? 'opacity-60' : ''}`}
                    >
                      {meal ? (
                        <div className="group relative bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-2 border border-teal-100 hover:border-teal-300 transition-all hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{meal.image}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {meal.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {meal.prepTime + meal.cookTime} min
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveMeal(day.dateKey, mealType)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center shadow-md"
                            title="Remove meal"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddMealClick(day.dateKey, mealType)}
                          className={`w-full h-16 border-2 border-dashed rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all flex items-center justify-center group ${
                            day.isPast
                              ? 'border-gray-200 cursor-not-allowed opacity-50'
                              : 'border-gray-200'
                          }`}
                          disabled={day.isPast}
                        >
                          <svg
                            className={`w-5 h-5 transition-colors ${
                              day.isPast
                                ? 'text-gray-300'
                                : 'text-gray-300 group-hover:text-teal-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Past days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200" />
              <span>Planned meal</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Click on empty slots to add meals
          </p>
        </div>
      </div>
    </div>
  );
}
