import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  gmdnCode?: string;
  emdnCode?: string;
  initialType?: 'error_report' | 'mapping_suggestion';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  gmdnCode, 
  emdnCode, 
  initialType = 'error_report' 
}) => {
  const [type, setType] = useState<'error_report' | 'mapping_suggestion'>(initialType);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email.trim() || 'anonymous',
          gmdnCode,
          emdnCode,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setMessage('');
          setEmail('');
        }, 2000);
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="error_report"
                checked={type === 'error_report'}
                onChange={(e) => setType(e.target.value as 'error_report')}
                className="mr-2"
              />
              <span className="text-sm">Report an Error</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="mapping_suggestion"
                checked={type === 'mapping_suggestion'}
                onChange={(e) => setType(e.target.value as 'mapping_suggestion')}
                className="mr-2"
              />
              <span className="text-sm">Suggest Code Mapping</span>
            </label>
          </div>
        </div>

        {(gmdnCode || emdnCode) && (
          <div className="mb-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600">Related to:</p>
            {gmdnCode && <p className="text-sm font-mono">GMDN: {gmdnCode}</p>}
            {emdnCode && <p className="text-sm font-mono">EMDN: {emdnCode}</p>}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={type === 'error_report' 
              ? "Describe the error you found..." 
              : "Suggest a code mapping or improvement..."
            }
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            id="feedback-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com (for follow-up)"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Help us improve the medical device nomenclature database
        </p>
      </div>
    </div>
  );
};