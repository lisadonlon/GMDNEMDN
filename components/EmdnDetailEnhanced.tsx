import React from 'react';
import { EmdnCode } from '../types';

interface EmdnDetailEnhancedProps {
  code: EmdnCode | null;
  allCodes: EmdnCode[];
}

const EmdnDetailEnhanced: React.FC<EmdnDetailEnhancedProps> = ({
  code,
  allCodes
}) => {

  // ICD-10 mappings disabled (semantic relationships removed)
  // Future ICD integration would go here

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
  // Get the main category (first letter of the code)
  const mainCategory = code.code.charAt(0);
  const categoryName = (() => {
    switch (mainCategory) {
      case 'A': return 'Administration, Withdrawal and Collection';
      case 'B': return 'Haematology and Haemotransfusion';
      case 'C': return 'Cardiocirculatory System';
      case 'D': return 'Disinfectants, Antiseptics, Sterilising Agents';
      case 'F': return 'Dialysis';
      case 'G': return 'Gastrointestinal';
      case 'H': return 'Suture Devices';
      case 'J': return 'Active-Implantable Devices';
      case 'K': return 'Endotherapy and Electrosurgical';
      case 'L': return 'Reusable Surgical Instruments';
      case 'M': return 'General and Specialist Dressings';
      case 'N': return 'Nervous and Medullary Systems';
      case 'P': return 'Implantable Prosthetic and Osteosynthesis';
      case 'Q': return 'Dental, Ophthalmologic and ENT';
      case 'R': return 'Respiratory and Anaesthesia';
      case 'S': return 'Sterilisation Devices';
      case 'T': return 'Patient Protective Equipment';
      case 'U': return 'Urogenital System';
      case 'V': return 'Various Medical Devices';
      case 'W': return 'In Vitro Diagnostic';
      case 'X': return 'Products Without Medical Purpose';
      case 'Y': return 'Devices for Persons with Disabilities';
      case 'Z': return 'Medical Equipment and Accessories';
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
      {/* ICD-10 Clinical Indications - Disabled (semantic relationships removed) */}

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