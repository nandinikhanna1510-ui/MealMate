'use client';

import { useState, useEffect } from 'react';
import { GroceryItem } from '@/types';

interface SwiggyHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryItems: GroceryItem[];
  familySize: number;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function SwiggyHandoffModal({
  isOpen,
  onClose,
  groceryItems,
  familySize,
}: SwiggyHandoffModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedClaudePrompt, setCopiedClaudePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'claude'>('claude');

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setCopiedClaudePrompt(false);
      setShowQRCode(false);
    }
  }, [isOpen]);

  // Format grocery list for copying
  const formatGroceryList = () => {
    const grouped = groceryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

    let text = `MealMate Grocery List (${groceryItems.length} items)\n`;
    text += `For ${familySize} people\n\n`;

    Object.entries(grouped).forEach(([category, items]) => {
      text += `${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
      items.forEach(item => {
        text += `  - ${item.name} - ${item.quantity} ${item.unit}\n`;
      });
      text += '\n';
    });

    return text;
  };

  // Generate Claude prompt for Swiggy MCP
  const generateClaudePrompt = () => {
    const grouped = groceryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

    let prompt = `Hi Claude! Please help me order groceries from Swiggy Instamart using your connected Swiggy MCP.

**Family Size:** ${familySize} people
**Total Items:** ${groceryItems.length}

**Shopping List:**
`;

    Object.entries(grouped).forEach(([category, items]) => {
      const emoji = getCategoryEmoji(category);
      prompt += `\n${emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
      items.forEach(item => {
        prompt += `   - ${item.name}: ${item.quantity} ${item.unit}\n`;
      });
    });

    prompt += `
**Instructions:**
1. Search for each item on Swiggy Instamart
2. Add the best matching product to my cart (prefer items in stock)
3. Match quantities as closely as possible
4. If an exact item isn't found, pick a close alternative
5. After adding all items, show me the cart summary with total

Please proceed with building my cart!`;

    return prompt;
  };

  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      vegetables: '🥬',
      fruits: '🍎',
      dairy: '🥛',
      protein: '🥩',
      grains: '🌾',
      spices: '🌶',
      pantry: '🏪',
      other: '📦',
    };
    return emojis[category] || '📦';
  };

  // Copy list to clipboard
  const copyToClipboard = async () => {
    const text = formatGroceryList();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Copy Claude prompt to clipboard
  const copyClaudePrompt = async () => {
    const prompt = generateClaudePrompt();
    await navigator.clipboard.writeText(prompt);
    setCopiedClaudePrompt(true);
    setTimeout(() => setCopiedClaudePrompt(false), 3000);
  };

  // Open Swiggy Instamart
  const openSwiggyInstamart = () => {
    const swiggyUrl = 'https://www.swiggy.com/instamart';
    const swiggyAppLink = 'swiggy://instamart';

    if (isMobile) {
      // Try to open app first, fall back to web
      const start = Date.now();
      window.location.href = swiggyAppLink;
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.open(swiggyUrl, '_blank');
        }
      }, 1500);
    } else {
      window.open(swiggyUrl, '_blank');
    }
  };

  // Open Claude Desktop
  const openClaudeDesktop = () => {
    // Try to open Claude desktop app
    window.open('claude://', '_blank');
  };

  // QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://www.swiggy.com/instamart')}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Order Groceries</h2>
                <p className="text-white/80 text-sm">
                  {groceryItems.length} items ready to order
                </p>
              </div>
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

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('claude')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'claude'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🤖</span>
            <span>Claude + Swiggy MCP</span>
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Recommended</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>📋</span>
            <span>Manual Order</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'claude' ? (
            <>
              {/* Claude MCP Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <span>✨</span> Seamless Ordering with Claude
                </h3>
                <p className="text-sm text-purple-800 mb-3">
                  If you have Swiggy Instamart MCP connected to Claude Desktop, you can order automatically!
                </p>
                <ol className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Copy the Claude prompt below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Open Claude Desktop (with Swiggy MCP connected)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Paste the prompt and Claude will build your cart!</span>
                  </li>
                </ol>
              </div>

              {/* Claude Prompt Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>📝</span> Claude Prompt
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {groceryItems.length} items
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto text-sm bg-white border border-gray-200 rounded-lg p-3 font-mono text-gray-700 whitespace-pre-wrap">
                  {generateClaudePrompt()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Copy Claude Prompt Button */}
                <button
                  onClick={copyClaudePrompt}
                  className={`w-full py-4 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    copiedClaudePrompt
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {copiedClaudePrompt ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied! Now paste in Claude</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Prompt for Claude</span>
                    </>
                  )}
                </button>

                {/* Open Claude Desktop Button */}
                <button
                  onClick={openClaudeDesktop}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                >
                  <span className="text-lg">🤖</span>
                  <span>Open Claude Desktop</span>
                </button>
              </div>

              {/* MCP Setup Help */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <span>💡</span> Don't have Swiggy MCP?
                </h4>
                <p className="text-sm text-amber-800">
                  You can connect Swiggy Instamart MCP to Claude Desktop for seamless grocery ordering.
                  Visit <span className="font-mono bg-amber-100 px-1 rounded">https://mcp.swiggy.com/im</span> to set it up.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Manual Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>📋</span> Manual Ordering
                </h3>
                <ol className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Copy your grocery list below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Open Swiggy Instamart</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Search and add each item to your cart</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                    <span>Checkout with your preferred payment method</span>
                  </li>
                </ol>
              </div>

              {/* Grocery List Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Your Grocery List</h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {groceryItems.length} items
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
                  {groceryItems.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-500">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                  {groceryItems.length > 10 && (
                    <div className="text-center text-gray-500 text-xs pt-2">
                      +{groceryItems.length - 10} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Copy List Button */}
                <button
                  onClick={copyToClipboard}
                  className={`w-full py-4 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Grocery List</span>
                    </>
                  )}
                </button>

                {/* Open Swiggy Button */}
                <button
                  onClick={openSwiggyInstamart}
                  className="w-full py-4 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-3"
                >
                  <span className="text-xl">🛍</span>
                  <div className="text-left">
                    <div>Open Swiggy Instamart</div>
                    <div className="text-xs font-normal text-orange-100">
                      {isMobile ? 'Opens in Swiggy app' : 'Opens in new tab'}
                    </div>
                  </div>
                </button>

                {/* QR Code for Desktop */}
                {!isMobile && (
                  <>
                    <button
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 text-sm flex items-center justify-center gap-2"
                    >
                      <span>📷</span>
                      <span>{showQRCode ? 'Hide QR Code' : 'Scan QR to open on phone'}</span>
                    </button>

                    {showQRCode && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
                          <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scan to open Swiggy Instamart</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>

          {/* Powered By */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">Powered by</span>
            <span className="text-xs font-medium text-orange-600">Swiggy Instamart</span>
            <span className="text-xs text-gray-400">+</span>
            <span className="text-xs font-medium text-purple-600">Claude AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
