'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/data/recipes';
import { MealType, GroceryItem } from '@/types';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { RecipeBrowser } from '@/components/RecipeBrowser';
import { MealCalendar } from '@/components/MealCalendar';
import { GroceryList } from '@/components/GroceryList';
import { RecipeModal } from '@/components/RecipeModal';
import { AddMealModal } from '@/components/AddMealModal';
import { OrderModal } from '@/components/OrderModal';
import { OnboardingTour } from '@/components/OnboardingTour';
import { LoginModal } from '@/components/LoginModal';
import { SwiggyConnectModal } from '@/components/SwiggyConnectModal';
import { OrderingModal } from '@/components/OrderingModal';
import { SettingsSidebar } from '@/components/SettingsSidebar';

type Tab = 'recipes' | 'calendar' | 'groceries';

const TOUR_COMPLETED_KEY = 'meal-planner-tour-completed';
const SWIGGY_CONNECTED_KEY = 'mealmate-swiggy-connected';
const SWIGGY_ADDRESS_KEY = 'mealmate-swiggy-address';
const SIDEBAR_COLLAPSED_KEY = 'mealmate-sidebar-collapsed';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [addMealContext, setAddMealContext] = useState<{ day: string; mealType: MealType } | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourReady, setTourReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSwiggyConnect, setShowSwiggyConnect] = useState(false);
  const [showOrdering, setShowOrdering] = useState(false);
  const [isSwiggyConnected, setIsSwiggyConnected] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
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
  } = useMealPlan();

  const {
    preferences,
    isLoaded: prefsLoaded,
    setFamilySize,
    setDiet,
    setNutritionPreference,
    toggleAllergen,
    clearAllergens,
    toggleCuisine,
    toggleHealthGoal,
    setCookingSkill,
    setBudgetLevel,
    toggleMealTime,
    completeOnboarding,
  } = useUserPreferences();

  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    logout,
    sendOTP,
    verifyOTP,
  } = useAuth();

  // Check if user has completed the tour before
  useEffect(() => {
    if (isLoaded && prefsLoaded) {
      const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
      if (!tourCompleted) {
        setTimeout(() => {
          setShowTour(true);
          setTourReady(true);
        }, 500);
      } else {
        setTourReady(true);
      }
    }
  }, [isLoaded, prefsLoaded]);

  // Load sidebar collapsed state
  useEffect(() => {
    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (collapsed === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Check Swiggy connection status and saved address
  useEffect(() => {
    const connected = localStorage.getItem(SWIGGY_CONNECTED_KEY);
    if (connected === 'true') {
      setIsSwiggyConnected(true);
    }
    const savedAddress = localStorage.getItem(SWIGGY_ADDRESS_KEY);
    if (savedAddress) {
      setSelectedAddressId(savedAddress);
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  };

  const handleRestartTour = () => {
    setShowTour(true);
  };

  const handleAddToMeal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleAddMealFromModal = (day: string, mealType: MealType) => {
    if (selectedRecipe) {
      addMeal(day, mealType, selectedRecipe);
      setSelectedRecipe(null);
    }
  };

  const handleAddMealClick = (day: string, mealType: MealType) => {
    setAddMealContext({ day, mealType });
  };

  const handleSelectRecipeFromAddModal = (recipe: Recipe) => {
    if (addMealContext) {
      addMeal(addMealContext.day, addMealContext.mealType, recipe);
      setAddMealContext(null);
    }
  };

  const handleOrderWithClaude = () => {
    setShowOrderModal(true);
  };

  const handleLoginSuccess = () => {
    // Could trigger a refresh of user data or show a success message
  };

  // Handle Swiggy connection success
  const handleSwiggyConnected = (addressId: string) => {
    setIsSwiggyConnected(true);
    localStorage.setItem(SWIGGY_CONNECTED_KEY, 'true');
    if (addressId) {
      setSelectedAddressId(addressId);
      localStorage.setItem(SWIGGY_ADDRESS_KEY, addressId);
    }
    setShowSwiggyConnect(false);
  };

  // State for edited grocery items
  const [editedGroceryItems, setEditedGroceryItems] = useState<GroceryItem[] | null>(null);

  // Handle "Order Now" click with edited items
  const handleOrderNow = (editedItems: GroceryItem[]) => {
    setEditedGroceryItems(editedItems);
    setShowOrdering(true);
  };

  // Handle connect Swiggy click
  const handleConnectSwiggy = () => {
    setShowSwiggyConnect(true);
  };

  // Handle login for ordering
  const handleLoginForOrdering = () => {
    setShowLoginModal(true);
  };

  // Toggle sidebar collapse
  const handleToggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  const totalMeals = getTotalMeals();
  const groceryItems = getGroceryList(preferences.familySize);

  const tabs: { id: Tab; label: string; icon: string; badge?: number; tourClass: string }[] = [
    { id: 'recipes', label: 'Recipes', icon: '📖', tourClass: 'tour-recipes-tab' },
    { id: 'calendar', label: 'Meal Plan', icon: '📅', badge: totalMeals, tourClass: 'tour-mealplan-tab' },
    { id: 'groceries', label: 'Groceries', icon: '🛒', badge: groceryItems.length, tourClass: 'tour-groceries-tab' },
  ];

  if (!isLoaded || !prefsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🥗</div>
          <p className="text-gray-600 font-medium">Loading MealMate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-primary)' }}>
      {/* Onboarding Tour */}
      {tourReady && (
        <OnboardingTour
          isOpen={showTour}
          onComplete={handleTourComplete}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 tour-welcome">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
                <span className="text-xl">🥗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MealMate</h1>
                <p className="text-xs text-gray-500">Plan • Shop • Cook</p>
              </div>
            </div>

            {/* Desktop Nav - Centered */}
            <nav className="hidden md:flex items-center gap-1 tour-tabs bg-gray-100 rounded-xl p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${tab.tourClass} ${
                    activeTab === tab.id
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Help/Tour Button */}
              <button
                onClick={handleRestartTour}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Take a tour"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">Help</span>
              </button>

              {/* Auth Button */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs text-gray-500">Welcome back</span>
                    <span className="text-sm font-medium text-gray-900">{user.phone}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-colors font-medium shadow-lg shadow-teal-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden md:inline">Sign In</span>
                </button>
              )}

              {/* Clear Plan Button */}
              {totalMeals > 0 && (
                <button
                  onClick={clearMealPlan}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-center text-sm font-medium transition-all flex flex-col items-center gap-1 ${tab.tourClass} ${
                  activeTab === tab.id
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Settings Sidebar - Hidden on mobile */}
        <div className="hidden lg:block sticky top-16 h-[calc(100vh-64px)]">
          <SettingsSidebar
            preferences={preferences}
            onFamilySizeChange={setFamilySize}
            onDietChange={setDiet}
            onAllergenToggle={toggleAllergen}
            onClearAllergens={clearAllergens}
            onCuisineToggle={toggleCuisine}
            onHealthGoalToggle={toggleHealthGoal}
            onCookingSkillChange={setCookingSkill}
            onBudgetChange={setBudgetLevel}
            onMealTimeToggle={toggleMealTime}
            onCompleteOnboarding={completeOnboarding}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-64px)]">
          <div className="max-w-6xl mx-auto">
            {/* Page Headers */}
            {activeTab === 'recipes' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Recipes</h2>
                <p className="text-gray-600">
                  Discover {preferences.nutritionPreference !== 'all' ? preferences.nutritionPreference + ' ' : ''}
                  {preferences.diet !== 'all' ? preferences.diet + ' ' : ''}recipes
                  {preferences.allergens.length > 0 && ' (excluding your allergens)'}
                </p>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Meal Plan</h2>
                  <p className="text-gray-600">
                    {totalMeals > 0
                      ? `${totalMeals} meals planned for ${preferences.familySize} ${preferences.familySize === 1 ? 'person' : 'people'}`
                      : 'Start planning your meals by clicking on any slot'}
                  </p>
                </div>
                {totalMeals > 0 && (
                  <button
                    onClick={() => setActiveTab('groceries')}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-200"
                  >
                    <span>🛒</span>
                    View Grocery List
                  </button>
                )}
              </div>
            )}

            {activeTab === 'groceries' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Grocery List</h2>
                <p className="text-gray-600">
                  {groceryItems.length > 0
                    ? `${groceryItems.length} items scaled for ${preferences.familySize} ${preferences.familySize === 1 ? 'person' : 'people'}`
                    : 'Add meals to your plan to generate a shopping list'}
                </p>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'recipes' && (
              <div className="tour-filters">
                <RecipeBrowser
                  onAddToMeal={handleAddToMeal}
                  onViewDetails={handleViewDetails}
                  userPreferences={preferences}
                />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="tour-calendar">
                <MealCalendar
                  mealPlan={mealPlan}
                  planDays={planDays}
                  dateRange={dateRange}
                  onRemoveMeal={removeMeal}
                  onAddMealClick={handleAddMealClick}
                  onUpdateDateRange={updateDateRange}
                  onSetQuickRange={setQuickRange}
                />
              </div>
            )}

            {activeTab === 'groceries' && (
              <GroceryList
                items={groceryItems}
                onOrderNow={handleOrderNow}
                isSwiggyConnected={isSwiggyConnected}
                onConnectSwiggy={handleConnectSwiggy}
                isAuthenticated={isAuthenticated}
                onLogin={handleLoginForOrdering}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span>🥗</span>
              <span>MealMate - Your Weekly Meal Planning Companion</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Powered by</span>
              <span className="font-medium text-orange-600">Swiggy Instamart</span>
              <span>+</span>
              <span className="font-medium text-teal-600">Claude AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddToMeal={handleAddMealFromModal}
        />
      )}

      {addMealContext && (
        <AddMealModal
          day={addMealContext.day}
          mealType={addMealContext.mealType}
          onClose={() => setAddMealContext(null)}
          onSelectRecipe={handleSelectRecipeFromAddModal}
        />
      )}

      {showOrderModal && (
        <OrderModal
          orderPrompt={generateOrderPrompt(preferences)}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        sendOTP={sendOTP}
        verifyOTP={verifyOTP}
      />

      {/* Swiggy Connect Modal */}
      <SwiggyConnectModal
        isOpen={showSwiggyConnect}
        onClose={() => setShowSwiggyConnect(false)}
        onConnected={handleSwiggyConnected}
      />

      {/* Ordering Modal - Seamless in-app ordering */}
      <OrderingModal
        isOpen={showOrdering}
        onClose={() => {
          setShowOrdering(false);
          setEditedGroceryItems(null);
        }}
        groceryItems={editedGroceryItems || groceryItems}
        allergens={preferences.allergens}
        familySize={preferences.familySize}
        preSelectedAddressId={selectedAddressId}
        isSwiggyConnected={isSwiggyConnected}
        onNeedsSwiggyAuth={() => setShowSwiggyConnect(true)}
      />
    </div>
  );
}
