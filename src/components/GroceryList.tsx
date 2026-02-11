'use client';

import { useState, useEffect } from 'react';
import { GroceryItem } from '@/types';
import { SwiggyHandoffModal } from './SwiggyHandoffModal';
import { OrderingChatModal } from './OrderingChatModal';

interface EditableGroceryItem extends GroceryItem {
  id: string;
  isRemoved: boolean;
  isEdited: boolean;
  originalQuantity: string;
}

interface GroceryListProps {
  items: GroceryItem[];
  familySize?: number;
}

export function GroceryList({
  items,
  familySize = 2,
}: GroceryListProps) {
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableGroceryItem[]>([]);
  const [customItems, setCustomItems] = useState<EditableGroceryItem[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showOrderingChat, setShowOrderingChat] = useState(false);

  // Initialize editable items when items change
  useEffect(() => {
    setEditableItems(
      items.map((item, idx) => ({
        ...item,
        id: `item-${idx}-${item.name}`,
        isRemoved: false,
        isEdited: false,
        originalQuantity: item.quantity,
      }))
    );
  }, [items]);

  const categoryIcons: Record<string, string> = {
    vegetables: '🥬',
    fruits: '🍎',
    dairy: '🥛',
    protein: '🥩',
    grains: '🌾',
    spices: '🌶️',
    pantry: '🏪',
    other: '📦',
  };

  const categoryOptions = [
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'protein', label: 'Protein' },
    { value: 'grains', label: 'Grains' },
    { value: 'spices', label: 'Spices' },
    { value: 'pantry', label: 'Pantry' },
    { value: 'other', label: 'Other' },
  ];

  // Get all active items (not removed)
  const allActiveItems = [
    ...editableItems.filter(item => !item.isRemoved),
    ...customItems.filter(item => !item.isRemoved),
  ];

  const groupedItems = allActiveItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, EditableGroceryItem[]>);

  const copyToClipboard = () => {
    const text = allActiveItems
      .map(item => `${item.name}: ${item.quantity} ${item.unit}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle item removal (temporary - grays out)
  const toggleItemRemoval = (id: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isRemoved: !item.isRemoved } : item
        )
      );
    } else {
      setEditableItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isRemoved: !item.isRemoved } : item
        )
      );
    }
  };

  // Permanently delete item from list
  const deleteItem = (id: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomItems(prev => prev.filter(item => item.id !== id));
    } else {
      setEditableItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Update item quantity
  const updateQuantity = (id: string, newQuantity: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, quantity: newQuantity, isEdited: newQuantity !== item.originalQuantity }
            : item
        )
      );
    } else {
      setEditableItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, quantity: newQuantity, isEdited: newQuantity !== item.originalQuantity }
            : item
        )
      );
    }
  };

  // Add custom item
  const addCustomItem = () => {
    if (!newItemName.trim()) return;

    const newItem: EditableGroceryItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQuantity || '1',
      unit: newItemUnit || 'piece',
      category: newItemCategory,
      recipes: ['Custom'],
      isRemoved: false,
      isEdited: false,
      originalQuantity: newItemQuantity || '1',
    };

    setCustomItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('');
    setNewItemCategory('other');
    setShowAddCustom(false);
  };

  // Count changes
  const removedCount = editableItems.filter(item => item.isRemoved).length;
  const editedCount = [...editableItems, ...customItems].filter(item => item.isEdited && !item.isRemoved).length;
  const addedCount = customItems.filter(item => !item.isRemoved).length;

  if (items.length === 0 && customItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in grocery list</h3>
        <p className="text-gray-500 mb-6">Add meals to your meal plan to generate a shopping list</p>

        {/* Add Custom Item Button for empty state */}
        <button
          onClick={() => {
            setEditMode(true);
            setShowAddCustom(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Item
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🛒</span>
                Grocery List
              </h2>
              <p className="text-teal-100 text-sm">
                {allActiveItems.length} items to buy
                {(removedCount > 0 || editedCount > 0 || addedCount > 0) && (
                  <span className="ml-2">
                    ({removedCount > 0 && `${removedCount} removed`}
                    {editedCount > 0 && `${removedCount > 0 ? ', ' : ''}${editedCount} edited`}
                    {addedCount > 0 && `${removedCount > 0 || editedCount > 0 ? ', ' : ''}${addedCount} added`})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  editMode
                    ? 'bg-white text-teal-700'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {editMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </>
                )}
              </button>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Custom Item Form */}
        {editMode && showAddCustom && (
          <div className="p-4 bg-teal-50 border-b border-teal-100">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <span>➕</span> Add Custom Item
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Qty"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {categoryOptions.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {categoryIcons[cat.value]} {cat.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={addCustomItem}
                  disabled={!newItemName.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddCustom(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Custom Button */}
        {editMode && !showAddCustom && (
          <div className="px-4 pt-4">
            <button
              onClick={() => setShowAddCustom(true)}
              className="w-full py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-medium hover:bg-teal-50 hover:border-teal-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Custom Item
            </button>
          </div>
        )}

        {/* Items by Category */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{categoryIcons[category] || '📦'}</span>
                <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                <span className="text-xs text-gray-400">({categoryItems.length} items)</span>
              </div>
              <div className="space-y-2 pl-7">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all ${
                      item.isRemoved
                        ? 'bg-red-50 opacity-50'
                        : item.isEdited
                        ? 'bg-amber-50 border border-amber-200'
                        : item.recipes.includes('Custom')
                        ? 'bg-teal-50 border border-teal-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {editMode ? (
                      <>
                        {/* Toggle Include/Exclude */}
                        <button
                          onClick={() => toggleItemRemoval(item.id, item.recipes.includes('Custom'))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                            item.isRemoved
                              ? 'border-red-400 bg-red-100'
                              : 'border-teal-400 bg-teal-100'
                          }`}
                          title={item.isRemoved ? 'Include item' : 'Exclude item'}
                        >
                          {item.isRemoved ? (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                        </button>

                        {/* Item Name */}
                        <div className={`flex-1 ${item.isRemoved ? 'line-through text-gray-400' : ''}`}>
                          <span className="text-gray-900">{item.name}</span>
                          {item.recipes.includes('Custom') && (
                            <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Quantity Editor */}
                        {!item.isRemoved && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, e.target.value, item.recipes.includes('Custom'))}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <span className="text-gray-500 text-sm w-16">{item.unit}</span>
                          </div>
                        )}

                        {/* Delete Button - Permanently removes item */}
                        <button
                          onClick={() => deleteItem(item.id, item.recipes.includes('Custom'))}
                          className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center ml-2 transition-colors"
                          title="Delete item permanently"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="text-gray-900">{item.name}</span>
                          {item.recipes.includes('Custom') && (
                            <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                              Custom
                            </span>
                          )}
                          <span className="text-gray-400 text-sm ml-2">
                            ({item.quantity} {item.unit})
                          </span>
                        </div>
                        {!item.recipes.includes('Custom') && (
                          <div className="text-xs text-gray-400 max-w-[150px] truncate" title={item.recipes.join(', ')}>
                            For: {item.recipes.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Section */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          {/* Primary Order Button - Chat Interface */}
          <button
            onClick={() => setShowOrderingChat(true)}
            disabled={allActiveItems.length === 0}
            className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl">🛒</span>
            <span className="text-lg">Order on Swiggy Instamart</span>
          </button>

          {/* Secondary Option - Manual Copy */}
          <button
            onClick={() => setShowHandoffModal(true)}
            disabled={allActiveItems.length === 0}
            className="w-full mt-2 py-2 px-4 text-gray-600 hover:text-gray-900 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>📋</span>
            <span>Copy list manually instead</span>
          </button>

          {/* Powered By */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Powered by</span>
            <span className="text-xs font-medium text-orange-600">Swiggy Instamart</span>
            <span className="text-xs text-gray-400">+</span>
            <span className="text-xs font-medium text-purple-600">Claude AI</span>
          </div>
        </div>
      </div>

      {/* Ordering Chat Modal (Primary) */}
      <OrderingChatModal
        isOpen={showOrderingChat}
        onClose={() => setShowOrderingChat(false)}
        groceryItems={allActiveItems}
        familySize={familySize}
      />

      {/* Swiggy Handoff Modal (Secondary - Manual) */}
      <SwiggyHandoffModal
        isOpen={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
        groceryItems={allActiveItems}
        familySize={familySize}
      />
    </>
  );
}
