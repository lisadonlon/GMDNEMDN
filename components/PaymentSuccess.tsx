import React, { useEffect, useState } from 'react';

export const PaymentSuccess: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setStatus('error');
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/payment-success?session_id=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        // Activate premium access
        localStorage.setItem('meddev_premium', 'true');
        localStorage.setItem('meddev_premium_email', data.customerEmail || '');
        localStorage.setItem('meddev_payment_verified', 'true');
        
        setDetails(data);
        setStatus('success');
        
        // Redirect to main app after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Verifying your payment...</h2>
          <p className="text-gray-400 mt-2">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
          <p className="text-gray-400 mb-6">
            We couldn't verify your payment. Please contact support if you were charged.
          </p>
          <a 
            href="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-gray-300 mb-4">
          Thank you for upgrading to Premium Access!
        </p>
        
        {details && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Payment Details:</h3>
            <p className="text-sm text-gray-400">
              Amount: {details.currency} {details.amountPaid}
            </p>
            {details.customerEmail && (
              <p className="text-sm text-gray-400">
                Email: {details.customerEmail}
              </p>
            )}
          </div>
        )}

        <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2 text-green-300">You now have access to:</h3>
          <ul className="text-sm text-green-200 space-y-1">
            <li>✓ Unlimited usage time</li>
            <li>✓ All GMDN-EMDN mappings</li>
            <li>✓ Export functionality</li>
            <li>✓ Priority support</li>
            <li>✓ Future updates</li>
          </ul>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Redirecting you to the app in a few seconds...
        </p>
        
        <a 
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to App
        </a>
      </div>
    </div>
  );
};