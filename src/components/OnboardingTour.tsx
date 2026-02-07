'use client';

import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Optional action hint
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '.tour-welcome',
    title: '👋 Welcome to MealMate!',
    description: 'Your personal meal planning assistant. Let me show you around and help you get started with planning delicious meals for your family.',
    position: 'bottom',
  },
  {
    id: 'settings',
    target: '.tour-settings-btn',
    title: '⚙️ Set Your Preferences',
    description: 'First, click here to set your family size (1-8 people) and any food allergies. This helps us filter recipes and scale ingredient quantities automatically.',
    position: 'bottom',
    action: 'Click to open settings',
  },
  {
    id: 'family-size',
    target: '.tour-family-size',
    title: '👨‍👩‍👧‍👦 Family Size',
    description: 'Select how many people you\'re cooking for. All recipe ingredients will be automatically scaled to match!',
    position: 'right',
  },
  {
    id: 'allergens',
    target: '.tour-allergens',
    title: '⚠️ Allergen Preferences',
    description: 'Select any food allergies. Recipes containing these ingredients will be hidden, and our ordering system will warn about allergens.',
    position: 'right',
  },
  {
    id: 'tabs',
    target: '.tour-tabs',
    title: '📑 Navigation Tabs',
    description: 'Switch between browsing recipes, viewing your meal plan calendar, and managing your grocery list.',
    position: 'bottom',
  },
  {
    id: 'recipes',
    target: '.tour-recipes-tab',
    title: '🍳 Browse Recipes',
    description: 'Explore 110+ recipes across cuisines - South Indian, Punjabi, Continental & more! Filter by diet, cuisine, meal type, or nutrition goals.',
    position: 'bottom',
  },
  {
    id: 'filters',
    target: '.tour-filters',
    title: '🔍 Smart Filters',
    description: 'Filter recipes by cuisine, diet type, meal category, and nutrition goals (low-carb, high-protein, balanced).',
    position: 'bottom',
  },
  {
    id: 'recipe-card',
    target: '.tour-recipe-card',
    title: '🥘 Recipe Cards',
    description: 'Each card shows the recipe name, cuisine, prep time, and nutrition info. Click "Add to Meal" to add it to your weekly plan!',
    position: 'right',
    action: 'Click "Add to Meal" on any recipe',
  },
  {
    id: 'meal-plan',
    target: '.tour-mealplan-tab',
    title: '📅 Your Meal Plan',
    description: 'View your weekly meal calendar here. See all planned breakfasts, lunches, dinners, and snacks at a glance.',
    position: 'bottom',
  },
  {
    id: 'calendar',
    target: '.tour-calendar',
    title: '🗓️ Weekly Calendar',
    description: 'Your meal plan organized by day. Click on any empty slot to add a meal, or click a planned meal to view or remove it.',
    position: 'top',
  },
  {
    id: 'groceries',
    target: '.tour-groceries-tab',
    title: '🛒 Grocery List',
    description: 'All ingredients from your meal plan are automatically compiled into a smart grocery list, organized by category.',
    position: 'bottom',
  },
  {
    id: 'order',
    target: '.tour-order-btn',
    title: '🚀 Order with Claude',
    description: 'The magic button! Click here to generate a shopping prompt. Copy it to Claude (with Swiggy MCP) and it will automatically add items to your Instamart cart!',
    position: 'top',
    action: 'Click to generate order prompt',
  },
  {
    id: 'complete',
    target: '.tour-welcome',
    title: '🎉 You\'re All Set!',
    description: 'Start by setting your preferences, then browse recipes and build your perfect meal plan. Happy cooking!',
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function OnboardingTour({ onComplete, isOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = tourSteps[currentStep];

  const updateTargetPosition = useCallback(() => {
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // If element not found, use center of screen
      setTargetRect(new DOMRect(
        window.innerWidth / 2 - 100,
        window.innerHeight / 2 - 50,
        200,
        100
      ));
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;

    updateTargetPosition();

    // Update position on scroll or resize
    window.addEventListener('scroll', updateTargetPosition, true);
    window.addEventListener('resize', updateTargetPosition);

    return () => {
      window.removeEventListener('scroll', updateTargetPosition, true);
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [isOpen, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen || !targetRect) return null;

  const getTooltipPosition = () => {
    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top, left };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 8}
              y={targetRect.top - 8}
              width={targetRect.width + 16}
              height={targetRect.height + 16}
              rx="12"
              fill="black"
              className="transition-all duration-500 ease-out"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      <div
        className="absolute border-2 border-green-400 rounded-xl transition-all duration-500 ease-out"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)',
          pointerEvents: 'none',
        }}
      />

      {/* Pulsing ring animation */}
      <div
        className="absolute border-2 border-green-400 rounded-xl animate-ping"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip card */}
      <div
        className={`absolute bg-white rounded-2xl shadow-2xl p-6 transition-all duration-300 ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 320,
          zIndex: 10000,
        }}
      >
        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <div className="text-xs text-gray-400 mb-2">
          Step {currentStep + 1} of {tourSteps.length}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{step.description}</p>

        {step.action && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
            <span>👆</span>
            <span>{step.action}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              {currentStep === tourSteps.length - 1 ? 'Get Started!' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Animated cursor */}
      <div
        className="absolute w-8 h-8 pointer-events-none transition-all duration-700 ease-out"
        style={{
          top: targetRect.top + targetRect.height / 2 - 16,
          left: targetRect.left + targetRect.width / 2 - 16,
        }}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 drop-shadow-lg animate-bounce">
          <path
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1"
            d="M4,0 L4,17 L8,13 L12,21 L15,20 L11,12 L17,12 Z"
          />
        </svg>
      </div>
    </div>
  );
}
