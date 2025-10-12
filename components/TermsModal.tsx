import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Terms of Use & Data Disclaimers</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] text-slate-300 space-y-6">
          
          {/* Data Accuracy Disclaimer */}
          <section>
            <h3 className="text-lg font-semibold text-amber-400 mb-3">⚠️ Important Data Disclaimer</h3>
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>This tool provides reference mappings only.</strong> All GMDN-EMDN code mappings are provided for informational purposes and should not be considered definitive or complete.</p>
              <p><strong>Professional Verification Required:</strong> Users must independently verify all code mappings with official regulatory sources before using them for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Regulatory submissions (FDA, CE marking, etc.)</li>
                <li>Clinical data management</li>
                <li>Procurement and supply chain decisions</li>
                <li>Reimbursement coding</li>
              </ul>
            </div>
          </section>

          {/* Expanding Dataset */}
          <section>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">📈 Growing Dataset</h3>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Current Coverage:</strong> Our mapping database currently contains <strong>46 validated GMDN-EMDN mappings</strong> and is continuously expanding.</p>
              <p><strong>Ongoing Development:</strong> We regularly add new validated mappings based on:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>User feedback and mapping requests</li>
                <li>Regulatory updates and new device classifications</li>
                <li>Semantic analysis improvements</li>
                <li>Industry collaboration and validation</li>
              </ul>
              <p><strong>Request Mappings:</strong> Need a specific mapping? Use our feedback system to request new GMDN-EMDN relationships.</p>
            </div>
          </section>

          {/* Regulatory Compliance */}
          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-3">⚖️ Regulatory Responsibility</h3>
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>User Responsibility:</strong> Users are solely responsible for ensuring compliance with applicable regulations in their jurisdiction.</p>
              <p><strong>Official Sources:</strong> Always consult official sources:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>GMDN:</strong> Official GMDN Agency database</li>
                <li><strong>EMDN:</strong> European Commission EMDN system</li>
                <li><strong>Regulatory Bodies:</strong> FDA, Notified Bodies, National Competent Authorities</li>
              </ul>
              <p><strong>No Regulatory Advice:</strong> This tool does not provide regulatory, legal, or compliance advice.</p>
            </div>
          </section>

          {/* Service Terms */}
          <section>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">📋 Service Terms</h3>
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>€2 Annual Access:</strong> Payment provides 12-month access to all current and future mappings.</p>
              <p><strong>No Refunds:</strong> All payments are final. Service availability subject to standard terms.</p>
              <p><strong>Privacy:</strong> We do not store personal data. Access codes are generated deterministically.</p>
              <p><strong>Updates:</strong> Service improvements and new mappings are added regularly without additional cost.</p>
            </div>
          </section>

          {/* Liability Limitations */}
          <section>
            <h3 className="text-lg font-semibold text-red-400 mb-3">🛡️ Liability Limitations</h3>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Use at Your Own Risk:</strong> This service is provided "as is" without warranties of any kind.</p>
              <p><strong>No Liability:</strong> Donlon Life Science Consulting Limited disclaims liability for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Inaccurate or incomplete mappings</li>
                <li>Regulatory non-compliance resulting from use of this data</li>
                <li>Business decisions based on provided information</li>
                <li>Service interruptions or technical issues</li>
              </ul>
              <p><strong>Professional Services:</strong> For regulatory consulting, contact us directly.</p>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h3 className="text-lg font-semibold text-slate-400 mb-3">✅ Recommended Best Practices</h3>
            <div className="bg-slate-700/20 border border-slate-600/50 rounded-lg p-4 space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Cross-reference all mappings with official databases</li>
                <li>Maintain documentation of your verification process</li>
                <li>Consult regulatory experts for complex classifications</li>
                <li>Keep records of which mapping version you used</li>
                <li>Report any suspected errors via our feedback system</li>
              </ul>
            </div>
          </section>
        </div>
        
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-750">
          <p className="text-sm text-slate-400">
            Last updated: October 2025 | Contact: Donlon Life Science Consulting Limited
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Terms Link Component for Footer
interface TermsLinkProps {
  onClick: () => void;
}

export const TermsLink: React.FC<TermsLinkProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-blue-400 transition-colors text-sm underline"
    >
      Terms & Data Disclaimers
    </button>
  );
};

export default TermsModal;