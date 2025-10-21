import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  canDismiss?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, canDismiss = true }) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Prevent Escape key from closing modal when not dismissible
  React.useEffect(() => {
    if (!isOpen || canDismiss) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, canDismiss]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    console.log('Payment button clicked, email:', email);
    
    // Auto-set email if empty
    let finalEmail = email;
    if (!email || !email.includes('@')) {
      finalEmail = 'test@example.com';
      setEmail(finalEmail);
      console.log('Auto-set email to:', finalEmail);
    }

    setIsProcessing(true);
    setError('');

    try {
      const sessionId = localStorage.getItem('meddev_session');
      console.log('Session ID:', sessionId);
      
      // For local development, simulate Stripe checkout
      if (window.location.hostname === 'localhost') {
        console.log('Local development mode - simulating Stripe checkout');
        
        // Generate a fake session ID
        const fakeSessionId = 'cs_test_' + Math.random().toString(36).substr(2, 9);
        console.log('Generated fake session ID:', fakeSessionId);
        
        // Simulate redirect to success page after short delay
        setTimeout(() => {
          const successUrl = `/success.html?session_id=${fakeSessionId}`;
          console.log('Redirecting to:', successUrl);
          console.log('Current location:', window.location.href);
          window.location.href = successUrl;
        }, 1000);
        
        return;
      }
      
      console.log('Making request to /api/create-checkout...');
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email: finalEmail,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        if (data.demo) {
          // Demo mode - simulate payment
          console.log('Demo mode payment:', data);
          setTimeout(() => {
            localStorage.setItem('meddev_premium', 'true');
            localStorage.setItem('meddev_premium_email', email);
            onSuccess();
            setIsProcessing(false);
          }, 2000);
        } else {
          // Real Stripe - redirect to checkout
          window.location.href = data.checkoutUrl;
        }
      } else {
        setError(data.error || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Only allow closing by clicking overlay if dismissible
        if (canDismiss && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {canDismiss ? 'Upgrade to Premium' : 'Trial Expired - Upgrade Required'}
          </h2>
          {canDismiss && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-600 mb-2">€2.00 - Annual Access Code</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Unlimited access to all medical device codes
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              GMDN-EMDN mapping relationships
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Export functionality
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Priority support
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Valid for 1 full year
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              No personal data stored
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            After payment, you'll receive a unique access code to unlock all features for one year.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => {
              console.log('Email input changed:', e.target.value);
              setEmail(e.target.value);
            }}
            onFocus={() => console.log('Email input focused')}
            onInput={(e) => {
              console.log('Email input event:', e.currentTarget.value);
              setEmail(e.currentTarget.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
            disabled={isProcessing}
            autoComplete="email"
            autoFocus
            spellCheck="false"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          {canDismiss && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              // Reset premium status for testing
              localStorage.removeItem('meddev_premium');
              localStorage.removeItem('meddev_premium_email');
              localStorage.removeItem('meddev_payment_verified');
              localStorage.removeItem('meddev_access_code');
              console.log('Premium status reset for testing');
              setTimeout(() => handlePayment(), 100);
            }}
            disabled={isProcessing}
            className={`${canDismiss ? 'flex-1' : 'w-full'} bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50`}
          >
            {isProcessing ? 'Processing...' : 'Pay €2.00'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Secure payment processing. Your data is protected.
        </p>
      </div>
    </div>
  );
};