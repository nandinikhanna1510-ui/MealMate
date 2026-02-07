'use client';

import { useState, useEffect, useCallback } from 'react';
import { GroceryItem } from '@/types';
import { AddressSelector } from './AddressSelector';

interface OrderingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groceryItems: GroceryItem[];
  allergens: string[];
  familySize: number;
  preSelectedAddressId?: string | null;
  isSwiggyConnected: boolean;
  onNeedsSwiggyAuth: () => void;
}

type OrderStatus =
  | 'address_selection'
  | 'initializing'
  | 'processing'
  | 'cart_ready'
  | 'placing_order'
  | 'order_confirmed'
  | 'error';

interface OrderProgress {
  status: OrderStatus;
  currentItem: string;
  itemsProcessed: number;
  totalItems: number;
  itemsAdded: string[];
  itemsNotFound: string[];
  cartTotal?: number;
  cartId?: string;
  orderId?: string;
  error?: string;
  demoMode?: boolean;
  needsSwiggyAuth?: boolean;
  // Order confirmation fields
  swiggyOrderId?: string;
  estimatedDelivery?: string;
  deliveryAddress?: string;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Generate Swiggy deep link / universal link
function getSwiggyLink(cartId?: string, addressId?: string): { appLink: string; webLink: string } {
  // Enhanced deep links with cart and address
  const baseWebLink = 'https://www.swiggy.com/instamart';
  const baseAppLink = 'swiggy://instamart';

  if (cartId && addressId) {
    return {
      webLink: `${baseWebLink}/checkout?cartId=${cartId}&addressId=${addressId}&source=mealmate`,
      appLink: `${baseAppLink}/checkout?cartId=${cartId}&addressId=${addressId}&source=mealmate`,
    };
  } else if (cartId) {
    return {
      webLink: `${baseWebLink}/cart?id=${cartId}`,
      appLink: `${baseAppLink}/cart?id=${cartId}`,
    };
  }

  return { webLink: baseWebLink, appLink: baseAppLink };
}

export function OrderingModal({
  isOpen,
  onClose,
  groceryItems,
  allergens,
  familySize,
  preSelectedAddressId,
  isSwiggyConnected,
  onNeedsSwiggyAuth,
}: OrderingModalProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    preSelectedAddressId || null
  );
  const [isMobile, setIsMobile] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [progress, setProgress] = useState<OrderProgress>({
    status: isSwiggyConnected ? 'address_selection' : 'address_selection',
    currentItem: '',
    itemsProcessed: 0,
    totalItems: groceryItems.length,
    itemsAdded: [],
    itemsNotFound: [],
  });

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      status: isSwiggyConnected ? 'address_selection' : 'address_selection',
      currentItem: '',
      itemsProcessed: 0,
      totalItems: groceryItems.length,
      itemsAdded: [],
      itemsNotFound: [],
    });
    setShowQRCode(false);
  }, [groceryItems.length, isSwiggyConnected]);

  const startOrdering = useCallback(async () => {
    if (!selectedAddressId && isSwiggyConnected) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: 'Please select a delivery address',
      }));
      return;
    }

    try {
      // Start processing animation
      setProgress(prev => ({ ...prev, status: 'processing' }));

      // Animate through items while API call happens
      const animationPromise = animateItemProcessing();

      // Call backend API
      const response = await fetch('/api/order/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groceryItems,
          allergens,
          familySize,
          addressId: selectedAddressId,
        }),
      });

      // Wait for animation to complete
      await animationPromise;

      const data = await response.json();

      if (!response.ok) {
        if (data.needsSwiggyAuth) {
          setProgress(prev => ({
            ...prev,
            status: 'error',
            error: data.error || 'Please connect your Swiggy account',
            needsSwiggyAuth: true,
          }));
          return;
        }
        throw new Error(data.error || 'Failed to process order');
      }

      // Show cart ready with checkout options
      setProgress(prev => ({
        ...prev,
        status: 'cart_ready',
        currentItem: '',
        itemsAdded: Array.isArray(data.itemsAdded) ? data.itemsAdded :
          (typeof data.itemsAdded === 'number' ? groceryItems.slice(0, data.itemsAdded).map(i => i.name) : []),
        itemsNotFound: data.itemsNotFound || [],
        cartTotal: data.estimatedTotal,
        cartId: data.cartId,
        orderId: data.orderId,
        demoMode: data.demoMode,
      }));

    } catch (error) {
      console.error('Order error:', error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Something went wrong',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groceryItems, allergens, familySize, selectedAddressId, isSwiggyConnected]);

  // Place order directly (COD)
  const placeOrderDirectly = async () => {
    if (!progress.orderId) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: 'No order to place. Please try again.',
      }));
      return;
    }

    setProgress(prev => ({ ...prev, status: 'placing_order' }));

    try {
      const response = await fetch('/api/order/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: progress.orderId,
          addressId: selectedAddressId,
          paymentMethod: 'COD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Show order confirmation
      setProgress(prev => ({
        ...prev,
        status: 'order_confirmed',
        swiggyOrderId: data.swiggyOrderId,
        estimatedDelivery: data.estimatedDelivery,
        deliveryAddress: data.deliveryAddress,
        cartTotal: data.totalAmount || prev.cartTotal,
        demoMode: data.demoMode,
      }));

    } catch (error) {
      console.error('Checkout error:', error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to place order',
      }));
    }
  };

  // Animate through items to show progress
  const animateItemProcessing = async () => {
    const itemsAdded: string[] = [];

    for (let i = 0; i < groceryItems.length; i++) {
      const item = groceryItems[i];

      setProgress(prev => ({
        ...prev,
        currentItem: item.name,
        itemsProcessed: i + 1,
        itemsAdded: [...itemsAdded],
      }));

      itemsAdded.push(item.name);

      const delay = groceryItems.length > 10 ? 150 : 300;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        resetProgress();
        setSelectedAddressId(preSelectedAddressId || null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetProgress, preSelectedAddressId]);

  const handleOpenSwiggy = () => {
    const { appLink, webLink } = getSwiggyLink(progress.cartId, selectedAddressId || undefined);

    if (isMobile) {
      const start = Date.now();
      window.location.href = appLink;
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.open(webLink, '_blank');
        }
      }, 1500);
    } else {
      window.open(webLink, '_blank');
    }

    onClose();
  };

  const handleTryAgain = () => {
    if (progress.needsSwiggyAuth) {
      onNeedsSwiggyAuth();
      onClose();
      return;
    }
    resetProgress();
  };

  const handleStartOrder = () => {
    if (!selectedAddressId) {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: 'Please select a delivery address',
      }));
      return;
    }
    setProgress(prev => ({ ...prev, status: 'initializing' }));
    setTimeout(() => startOrdering(), 100);
  };

  if (!isOpen) return null;

  const progressPercentage = progress.totalItems > 0
    ? (progress.itemsProcessed / progress.totalItems) * 100
    : 0;

  // QR Code URL for Swiggy
  const { webLink } = getSwiggyLink(progress.cartId, selectedAddressId || undefined);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(webLink)}`;

  // Get header styling based on status
  const getHeaderStyle = () => {
    switch (progress.status) {
      case 'order_confirmed':
        return 'bg-gradient-to-r from-green-600 to-emerald-600';
      case 'cart_ready':
        return 'bg-gradient-to-r from-orange-500 to-amber-500';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'address_selection':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      case 'placing_order':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      default:
        return 'bg-gradient-to-r from-orange-500 to-amber-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`text-white p-6 ${getHeaderStyle()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {progress.status === 'order_confirmed' ? (
                  <span className="text-2xl">🎉</span>
                ) : progress.status === 'cart_ready' ? (
                  <span className="text-2xl">🛒</span>
                ) : progress.status === 'error' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : progress.status === 'address_selection' ? (
                  <span className="text-xl">📍</span>
                ) : progress.status === 'placing_order' ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {progress.status === 'order_confirmed'
                    ? 'Order Confirmed!'
                    : progress.status === 'cart_ready'
                    ? 'Cart Ready!'
                    : progress.status === 'error'
                    ? 'Order Failed'
                    : progress.status === 'address_selection'
                    ? 'Confirm Delivery'
                    : progress.status === 'placing_order'
                    ? 'Placing Order...'
                    : 'Building Your Cart...'}
                </h2>
                <p className="text-white/80 text-sm">
                  {progress.status === 'order_confirmed'
                    ? 'Your order is on its way!'
                    : progress.status === 'cart_ready'
                    ? 'Choose how to complete your order'
                    : progress.status === 'error'
                    ? 'Something went wrong'
                    : progress.status === 'address_selection'
                    ? 'Select your delivery address'
                    : progress.status === 'placing_order'
                    ? 'Confirming with Swiggy...'
                    : `Processing ${progress.itemsProcessed} of ${progress.totalItems} items`}
                </p>
              </div>
            </div>
            {['address_selection', 'cart_ready', 'order_confirmed'].includes(progress.status) && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Address Selection State */}
          {progress.status === 'address_selection' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{groceryItems.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Family Size</span>
                  <span className="font-medium">{familySize} people</span>
                </div>
                {allergens.length > 0 && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-red-500">🚫</span>
                    <span className="text-sm text-red-600">
                      Excluding: {allergens.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {isSwiggyConnected ? (
                <AddressSelector
                  selectedAddressId={selectedAddressId}
                  onAddressSelect={setSelectedAddressId}
                />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-xl">⚠️</span>
                    <div>
                      <h4 className="font-medium text-amber-800">Swiggy Not Connected</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Connect your Swiggy account to select a delivery address.
                      </p>
                      <button
                        onClick={() => {
                          onNeedsSwiggyAuth();
                          onClose();
                        }}
                        className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        Connect Swiggy Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartOrder}
                  disabled={!selectedAddressId && isSwiggyConnected}
                  className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Build Cart</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {(progress.status === 'processing' || progress.status === 'initializing') && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Adding items to cart</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {progress.currentItem && (
                <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Adding: <span className="font-medium text-gray-700">{progress.currentItem}</span>
                </p>
              )}
              <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
                {progress.itemsAdded.slice(-5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm animate-fadeIn">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placing Order State */}
          {progress.status === 'placing_order' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Placing Your Order</h3>
              <p className="text-gray-500">Confirming with Swiggy Instamart...</p>
            </div>
          )}

          {/* Cart Ready - Checkout Options */}
          {progress.status === 'cart_ready' && (
            <div className="space-y-4">
              {progress.demoMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-blue-600">🔧</span>
                  <p className="text-blue-800 text-sm">
                    <strong>Demo Mode:</strong> Orders are simulated.
                  </p>
                </div>
              )}

              {/* Cart Summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-800 font-medium">Items Added</span>
                  <span className="text-green-600 font-bold">
                    {Array.isArray(progress.itemsAdded) ? progress.itemsAdded.length : progress.itemsAdded}
                  </span>
                </div>
                {progress.cartTotal !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-800 font-medium">Estimated Total</span>
                    <span className="text-green-600 font-bold text-lg">₹{progress.cartTotal}</span>
                  </div>
                )}
              </div>

              {progress.itemsNotFound.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600">⚠️</span>
                    <div>
                      <p className="text-amber-800 font-medium text-sm">
                        {progress.itemsNotFound.length} items not found
                      </p>
                      <p className="text-amber-700 text-sm mt-1">
                        {progress.itemsNotFound.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout Options */}
              <div className="space-y-3 pt-4">
                <p className="text-sm font-medium text-gray-700 text-center">How would you like to checkout?</p>

                {/* Option 1: Direct Order (COD) */}
                <button
                  onClick={placeOrderDirectly}
                  className="w-full py-4 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">💵</span>
                    <div className="text-left">
                      <div>Place Order (Cash on Delivery)</div>
                      <div className="text-xs font-normal text-green-100">Order directly - no app needed</div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Open Swiggy */}
                <button
                  onClick={handleOpenSwiggy}
                  className="w-full py-4 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">📱</span>
                    <div className="text-left">
                      <div>Open in Swiggy</div>
                      <div className="text-xs font-normal text-orange-100">Edit cart, apply coupons, choose payment</div>
                    </div>
                  </div>
                </button>

                {/* QR Code for Desktop */}
                {!isMobile && (
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 text-sm flex items-center justify-center gap-2"
                  >
                    <span>📷</span>
                    <span>{showQRCode ? 'Hide QR Code' : 'Scan QR to open on phone'}</span>
                  </button>
                )}

                {!isMobile && showQRCode && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
                      <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Scan to open in Swiggy app</p>
                  </div>
                )}
              </div>

              <button onClick={onClose} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm">
                Cancel
              </button>
            </div>
          )}

          {/* Order Confirmed */}
          {progress.status === 'order_confirmed' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {progress.demoMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
                  <p className="text-blue-800 text-sm">
                    <strong>🔧 Demo Mode:</strong> This is a simulated order.
                  </p>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>

              <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono font-medium text-gray-900">{progress.swiggyOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Time</span>
                  <span className="font-medium text-green-600">{progress.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="font-medium text-gray-900">Cash on Delivery</span>
                </div>
                {progress.cartTotal && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-800 font-medium">Total Amount</span>
                    <span className="font-bold text-lg text-gray-900">₹{progress.cartTotal}</span>
                  </div>
                )}
              </div>

              {progress.deliveryAddress && (
                <div className="bg-blue-50 rounded-xl p-4 mt-4 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">📍</span>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Delivering to</p>
                      <p className="text-sm text-blue-700">{progress.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
                <p className="text-xs text-gray-500">
                  You'll receive updates from Swiggy about your delivery
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {progress.status === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {progress.needsSwiggyAuth ? 'Swiggy Not Connected' : 'Something went wrong'}
              </h3>
              <p className="text-gray-500 mb-6">{progress.error || 'Please try again'}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleTryAgain}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    progress.needsSwiggyAuth
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {progress.needsSwiggyAuth ? 'Connect Swiggy' : 'Try Again'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
