'use client';

import { useState } from 'react';

interface OrderModalProps {
  orderPrompt: string;
  onClose: () => void;
}

export function OrderModal({ orderPrompt, onClose }: OrderModalProps) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(orderPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openClaude = () => {
    window.open('https://claude.ai/new', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Order Groceries</h2>
              <p className="text-orange-100 text-sm">Using Claude + Swiggy Instamart</p>
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
        <div className="p-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>📋</span> How to Order
            </h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Make sure you have Claude Desktop with Swiggy MCP connected</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Copy the shopping prompt below</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Open Claude and paste the prompt</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Claude will help you find items on Swiggy Instamart and add them to cart</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                <span>Review your cart and complete the order!</span>
              </li>
            </ol>
          </div>

          {/* Setup Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <span>⚙️</span> First Time Setup
            </h3>
            <p className="text-sm text-yellow-800 mb-2">
              To connect Swiggy Instamart to Claude:
            </p>
            <ol className="space-y-1 text-sm text-yellow-800">
              <li>1. Open Claude Desktop or claude.ai</li>
              <li>2. Go to Settings → Connectors</li>
              <li>3. Add custom connector: <code className="bg-yellow-100 px-1 rounded">https://mcp.swiggy.com/im</code></li>
              <li>4. Authorize with your Swiggy account</li>
            </ol>
          </div>

          {/* Prompt Box */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Shopping Prompt</h3>
              <button
                onClick={copyPrompt}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {orderPrompt}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={copyPrompt}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              📋 Copy Prompt
            </button>
            <button
              onClick={openClaude}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
            >
              🚀 Open Claude
            </button>
          </div>

          {/* Warning */}
          <p className="text-center text-xs text-gray-500 mt-4">
            ⚠️ Keep the Swiggy app closed while using Claude + MCP to avoid session conflicts
          </p>
        </div>
      </div>
    </div>
  );
}
