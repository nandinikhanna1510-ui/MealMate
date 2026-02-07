'use client';

import { useState } from 'react';

interface SwiggyAddress {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface SwiggyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (selectedAddressId: string) => void;
}

type Step = 'intro' | 'phone' | 'otp' | 'addresses' | 'connecting' | 'success';

export function SwiggyConnectModal({ isOpen, onClose, onConnected }: SwiggyConnectModalProps) {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Phone + OTP state
  const [swiggyPhone, setSwiggyPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Addresses state
  const [addresses, setAddresses] = useState<SwiggyAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const resetState = () => {
    setStep('intro');
    setError('');
    setLoading(false);
    setSwiggyPhone('');
    setOtp('');
    setAddresses([]);
    setSelectedAddressId(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Send OTP to Swiggy phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/swiggy/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: swiggyPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and get addresses
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/swiggy/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: swiggyPhone, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Store addresses
      setAddresses(data.addresses || []);

      // If user has addresses, show address selection
      if (data.addresses && data.addresses.length > 0) {
        // Pre-select default address
        const defaultAddr = data.addresses.find((a: SwiggyAddress) => a.isDefault);
        setSelectedAddressId(defaultAddr?.id || data.addresses[0].id);
        setStep('addresses');
      } else {
        // No addresses - complete without address selection
        setStep('success');
        localStorage.setItem('mealmate-swiggy-connected', 'true');
        setTimeout(() => {
          onConnected('');
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Select address and complete
  const handleAddressSelect = () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    setStep('success');
    localStorage.setItem('mealmate-swiggy-connected', 'true');
    localStorage.setItem('mealmate-swiggy-address', selectedAddressId);

    setTimeout(() => {
      onConnected(selectedAddressId);
      handleClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Intro Step */}
        {step === 'intro' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Connect Swiggy</h2>
                    <p className="text-orange-100 text-sm">Link your Swiggy Instamart account</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Enter Swiggy Phone</h3>
                    <p className="text-sm text-gray-500">Use your Swiggy registered number</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Verify with OTP</h3>
                    <p className="text-sm text-gray-500">Enter OTP sent by Swiggy</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Select Address</h3>
                    <p className="text-sm text-gray-500">Choose delivery location</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">🔒</span>
                  <p className="text-sm text-amber-800">
                    Your Swiggy credentials are never stored. We only save a secure session token.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue with Swiggy</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Phone Entry Step */}
        {step === 'phone' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('intro')}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold">Enter Swiggy Phone</h2>
                  <p className="text-orange-100 text-sm">Your Swiggy registered number</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2 mb-4">
                <div className="flex items-center px-3 bg-gray-100 rounded-lg text-gray-600">
                  +91
                </div>
                <input
                  type="tel"
                  value={swiggyPhone}
                  onChange={(e) => setSwiggyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter Swiggy phone number"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-gray-900"
                  required
                  minLength={10}
                  maxLength={10}
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500 mb-4">
                This can be different from your MealMate phone number
              </p>

              <button
                type="submit"
                disabled={loading || swiggyPhone.length !== 10}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          </>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold">Enter OTP</h2>
                  <p className="text-orange-100 text-sm">Sent to +91{swiggyPhone}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit OTP from Swiggy
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-gray-900 text-center text-2xl tracking-widest font-mono mb-4"
                required
                minLength={6}
                maxLength={6}
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Change phone number
              </button>
            </form>
          </>
        )}

        {/* Address Selection Step */}
        {step === 'addresses' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Select Address</h2>
                  <p className="text-orange-100 text-sm">Choose delivery location</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
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
                        onChange={() => setSelectedAddressId(addr.id)}
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

              <button
                onClick={handleAddressSelect}
                disabled={!selectedAddressId}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue with this address</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to Swiggy...</h3>
            <p className="text-gray-500">Please wait while we set up your account</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connected! 🎉</h3>
            <p className="text-gray-500">Your Swiggy account is now linked</p>
          </div>
        )}
      </div>
    </div>
  );
}
