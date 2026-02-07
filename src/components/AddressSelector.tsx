'use client';

import { useState, useEffect } from 'react';

interface SwiggyAddress {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onAddressSelect: (addressId: string) => void;
  onRefresh?: () => void;
  compact?: boolean;
}

export function AddressSelector({
  selectedAddressId,
  onAddressSelect,
  onRefresh,
  compact = false,
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<SwiggyAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async (refresh = false) => {
    setLoading(true);
    setError('');

    try {
      const url = refresh ? '/api/swiggy/addresses?refresh=true' : '/api/swiggy/addresses';
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch addresses');
      }

      setAddresses(data.addresses || []);

      // Auto-select default address if none selected
      if (!selectedAddressId && data.addresses?.length > 0) {
        const defaultAddr = data.addresses.find((a: SwiggyAddress) => a.isDefault);
        onAddressSelect(defaultAddr?.id || data.addresses[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAddresses(true);
    onRefresh?.();
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Check if we're in demo mode (addresses have demo IDs)
  const isDemoMode = addresses.some((a) => a.id.startsWith('addr_demo'));

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 rounded-xl animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-red-50 rounded-xl border border-red-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => fetchAddresses()}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-amber-50 rounded-xl border border-amber-200`}>
        <div className="flex items-center gap-2 text-amber-800">
          <span className="text-xl">📍</span>
          <span className="text-sm">No saved addresses found. Please add an address in your Swiggy app.</span>
        </div>
      </div>
    );
  }

  // Compact mode - show selected address with dropdown
  if (compact) {
    return (
      <div className="relative">
        {/* Demo Mode Badge - Compact */}
        {isDemoMode && (
          <div className="mb-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-center gap-1.5">
            <span className="text-amber-600 text-xs">🧪</span>
            <span className="text-xs text-amber-700 font-medium">Demo Mode</span>
            <span className="text-xs text-amber-600">- Sample addresses</span>
          </div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600">📍</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {selectedAddress?.label || 'Delivery Address'}
                  </span>
                  {selectedAddress?.isDefault && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate max-w-[250px]">
                  {selectedAddress?.addressLine1}
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown */}
        {expanded && (
          <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => {
                  onAddressSelect(addr.id);
                  setExpanded(false);
                }}
                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  selectedAddressId === addr.id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedAddressId === addr.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  }`}>
                    {selectedAddressId === addr.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {addr.label || 'Address'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {addr.city} - {addr.pincode}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={handleRefresh}
                className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Refresh addresses
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode - show all addresses as cards
  return (
    <div className="space-y-3">
      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-lg">🧪</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Demo Mode</p>
              <p className="text-xs text-amber-700 mt-0.5">
                These are sample addresses for testing. In production, your actual Swiggy saved addresses will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">Select Delivery Address</h3>
        <button
          onClick={handleRefresh}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedAddressId === addr.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="address"
                value={addr.id}
                checked={selectedAddressId === addr.id}
                onChange={() => onAddressSelect(addr.id)}
                className="mt-1 text-orange-500 focus:ring-orange-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {addr.label || 'Address'}
                  </span>
                  {addr.isDefault && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                </p>
                <p className="text-sm text-gray-500">
                  {addr.city} - {addr.pincode}
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
