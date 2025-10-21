import React, { useState } from 'react';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (codeInfo: any) => void;
  canDismiss?: boolean;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({ isOpen, onClose, onSuccess, canDismiss = true }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

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

  const handleVerifyCode = async () => {
    if (!accessCode.trim()) {
      setError('Please enter your access code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/verify-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        // Store the access code and expiration
        localStorage.setItem('meddev_premium', 'true');
        localStorage.setItem('meddev_access_code', accessCode.trim());
        localStorage.setItem('meddev_expires_at', data.expiresAt);
        
        onSuccess({
          expiresAt: data.expiresAt,
          daysRemaining: data.daysRemaining,
          message: data.message
        });
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCodeInput = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Add dashes every 3 characters
    const formatted = cleaned.match(/.{1,3}/g)?.join('-') || cleaned;
    return formatted.substring(0, 15); // Limit to XXX-XXX-XXX-XXX format
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value);
    setAccessCode(formatted);
    setError(''); // Clear error when typing
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
            {canDismiss ? 'Enter Access Code' : 'Trial Expired - Enter Access Code'}
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

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-4">
            Enter the access code you received after payment to unlock annual access.
          </p>
          
          <label htmlFor="access-code" className="block text-sm font-medium text-gray-700 mb-1">
            Access Code
          </label>
          <input
            type="text"
            id="access-code"
            value={accessCode}
            onChange={handleCodeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
            placeholder="XXX-XXX-XXX-XXX"
            disabled={isVerifying}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: XXX-XXX-XXX-XXX (dashes will be added automatically)
          </p>
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
              disabled={isVerifying}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleVerifyCode}
            disabled={isVerifying || !accessCode.trim()}
            className={`${canDismiss ? 'flex-1' : 'w-full'} bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50`}
          >
            {isVerifying ? 'Verifying...' : 'Activate Access'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            <strong>Don't have a code?</strong> Purchase annual access for just €2 to get your access code instantly.
          </p>
        </div>
      </div>
    </div>
  );
};