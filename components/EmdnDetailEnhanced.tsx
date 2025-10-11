import React, { useState, useEffect } from 'react';
import { EmdnCode } from '../types';
import { 
  loadSemanticRelationships, 
  getIcdCodesForDevice, 
  IcdMatch 
} from '../data/semanticRelationships';
import { isFeatureEnabled } from '../config/features';

interface EmdnDetailEnhancedProps {
  code: EmdnCode | null;
  allCodes: EmdnCode[];
}

const EmdnDetailEnhanced: React.FC<EmdnDetailEnhancedProps> = ({
  code,
  allCodes
}) => {
  const [semanticLoaded, setSemanticLoaded] = useState(false);
  const [icdMatches, setIcdMatches] = useState<IcdMatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Load semantic relationships when component mounts
  useEffect(() => {
    const loadSemantic = async () => {
      try {
        await loadSemanticRelationships();
        setSemanticLoaded(true);
      } catch (error) {
        console.error('Failed to load semantic relationships:', error);
      }
    };

    if (!semanticLoaded) {
      loadSemantic();
    }
  }, [semanticLoaded]);

  // Get ICD matches when code changes
  useEffect(() => {
    if (code && semanticLoaded) {
      setLoading(true);
      const matches = getIcdCodesForDevice(code.code, 'emdn');
      setIcdMatches(matches);
      setLoading(false);
    } else {
      setIcdMatches([]);
    }
  }, [code, semanticLoaded]);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Select an EMDN Code</h3>
          <p className="text-sm">Choose a device from the list to view detailed information and semantic relationships.</p>
        </div>
      </div>
    );
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (confidence >= 70) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '👤';
      case 'expert': return '🎯';
      case 'auto': return '🤖';
      default: return '📊';
    }
  };

  // Get the main category (first letter of the code)
  const mainCategory = code.code.charAt(0);
  const categoryName = (() => {
    switch (mainCategory) {
      case 'A': return 'Anaesthesia and Respiration';
      case 'C': return 'Cardiology and Angiology';
      case 'G': return 'Gastroenterology and Hepatology';
      case 'B': return 'Central Nervous System';
      case 'D': return 'Dental Medicine';
      case 'E': return 'Ear, Nose, Throat';
      case 'F': return 'Hospital Hardware';
      case 'H': return 'Ophthalmology';
      case 'I': return 'Minimally Invasive Surgery';
      case 'J': return 'General and Plastic Surgery';
      case 'K': return 'Obstetrics and Gynaecology';
      case 'L': return 'Pathology';
      case 'M': return 'Microbiology';
      case 'N': return 'Nuclear Medicine';
      case 'O': return 'Orthopaedics';
      case 'P': return 'Renal, Urological, Reproductive';
      case 'Q': return 'Radiotherapy';
      case 'R': return 'Diagnostic Radiology';
      case 'S': return 'Non-Ionising Radiation';
      case 'T': return 'Rehabilitation Medicine';
      case 'U': return 'Transfusion Medicine';
      case 'V': return 'Contraception';
      case 'W': return 'First Aid';
      case 'X': return 'Hospital Aids';
      case 'Y': return 'Technical Aids for Disabled';
      case 'Z': return 'Health Informatics';
      default: return 'Medical Device';
    }
  })();

  // Find related codes in the same main category
  const relatedCodes = allCodes
    .filter(c => c.code.charAt(0) === mainCategory && c.code !== code.code)
    .slice(0, 5);

  // Determine device level based on code structure
  const deviceLevel = (() => {
    if (code.code.length === 1) return 'Category';
    if (code.code.length === 3) return 'Group';
    if (code.code.length === 5) return 'Sub-Group';
    return 'Product';
  })();

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-lg p-6 border border-sky-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-sky-300 mb-2">{code.code}</h2>
            <p className="text-lg text-slate-200 leading-relaxed">{code.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Category</div>
            <div className="text-lg font-semibold text-sky-400">{categoryName}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Level:</span>
            <span className="ml-2 text-slate-200">{deviceLevel}</span>
          </div>
          <div>
            <span className="text-slate-400">Parent Code:</span>
            <span className="ml-2 text-slate-200 font-mono">{code.parentCode || 'Root'}</span>
          </div>
        </div>
      </div>

      {/* Semantic Relationships - ICD-10 Diagnoses (Hidden in production until data is more complete) */}
      {isFeatureEnabled('icdClinicalIndications') && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
            🩺 Clinical Indications (ICD-10)
            {loading && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
          </h3>
          
          {!semanticLoaded ? (
            <div className="text-slate-400 text-sm">Loading semantic relationships...</div>
          ) : icdMatches.length > 0 ? (
            <div className="space-y-3">
              {icdMatches.map((match, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <code className="text-blue-400 font-mono text-sm bg-slate-800 px-2 py-1 rounded">
                        {match.code}
                      </code>
                      <span className={`text-xs px-2 py-1 rounded border ${getConfidenceBadgeColor(match.confidence)}`}>
                        {match.confidence}% confidence
                      </span>
                      <span className="text-xs text-slate-400">
                        {getSourceIcon(match.source)} {match.source}
                      </span>
                    </div>
                    <div className="text-slate-200 text-sm">{match.indication}</div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xs text-blue-300 mb-1">💡 Semantic Mapping Information</div>
                <div className="text-xs text-slate-400">
                  These ICD-10 codes represent medical conditions that typically require this device type.
                  Mappings are derived from clinical expertise, automated analysis, and manual curation.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center space-x-2 mb-2">
                <span>🔍</span>
                <span>No ICD-10 mappings available for this device</span>
              </div>
              <div className="text-xs text-slate-500">
                This device may not have established clinical indication mappings yet,
                or may be a general-purpose device used across multiple conditions.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Devices */}
      {relatedCodes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">🔗 Related Devices in {categoryName}</h3>
          <div className="space-y-2">
            {relatedCodes.map((relatedCode) => (
              <div 
                key={relatedCode.code}
                className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <code className="text-sky-400 font-mono text-sm">{relatedCode.code}</code>
                  <span className="text-slate-200 text-sm">{relatedCode.description}</span>
                </div>
                <div className="text-xs text-slate-400">→</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">📋 Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">EMDN Code:</span>
              <span className="ml-2 text-slate-200 font-mono">{code.code}</span>
            </div>
            <div>
              <span className="text-slate-400">Category:</span>
              <span className="ml-2 text-slate-200">{categoryName}</span>
            </div>
            <div>
              <span className="text-slate-400">Level:</span>
              <span className="ml-2 text-slate-200">{deviceLevel}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">Parent Code:</span>
              <span className="ml-2 text-slate-200 font-mono">{code.parentCode || 'Root'}</span>
            </div>
            <div>
              <span className="text-slate-400">Semantic Mappings:</span>
              <span className="ml-2 text-slate-200">{icdMatches.length} ICD-10 codes</span>
            </div>
            <div>
              <span className="text-slate-400">Related Devices:</span>
              <span className="ml-2 text-slate-200">{relatedCodes.length} in category</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmdnDetailEnhanced;