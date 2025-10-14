import React, { useState, useEffect } from 'react';

interface UsageTrackerProps {
  onUpgradeNeeded: () => void;
  onEnterCode: () => void;
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({ onUpgradeNeeded, onEnterCode }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(600000); // 10 minutes
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => 
    localStorage.getItem('meddev_session') || generateSessionId()
  );
  const bypassPaywall = import.meta.env.DEV || import.meta.env.VITE_BYPASS_PAYWALL === 'true';

  useEffect(() => {
    if (bypassPaywall) {
      localStorage.setItem('meddev_premium', 'true');
      localStorage.setItem('meddev_premium_email', 'dev@local.test');
      localStorage.removeItem('meddev_start_time');
      setIsPremium(true);
      return;
    }

    // Store session ID
    localStorage.setItem('meddev_session', sessionId);
    
    // Check if user has premium access
    const premiumStatus = localStorage.getItem('meddev_premium');
    if (premiumStatus === 'true') {
      setIsPremium(true);
      return;
    }

    // Start countdown
    const startTime = parseInt(localStorage.getItem('meddev_start_time') || '0');
    const now = Date.now();
    
    if (!startTime) {
      localStorage.setItem('meddev_start_time', now.toString());
      startCountdown(600000); // 10 minutes
    } else {
      const elapsed = now - startTime;
      const remaining = Math.max(0, 600000 - elapsed);
      
      if (remaining === 0) {
        onUpgradeNeeded();
      } else {
        startCountdown(remaining);
      }
    }
  }, [sessionId, onUpgradeNeeded, bypassPaywall]);

  const startCountdown = (initialTime: number) => {
    setTimeRemaining(initialTime);
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        
        if (newTime <= 0) {
          clearInterval(interval);
          onUpgradeNeeded();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isPremium) {
    return (
      <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-medium">✨ Premium Access</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 font-medium">⏱️ Free Trial</span>
          <span className="text-blue-800 font-mono text-lg">
            {formatTime(timeRemaining)}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEnterCode}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
          >
            Enter Code
          </button>
          <button
            onClick={onUpgradeNeeded}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Buy €2
          </button>
        </div>
      </div>
      <p className="text-blue-700 text-sm mt-1">
        Get unlimited access with an annual access code for just €2
      </p>
    </div>
  );
};

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}