
import React from 'react';
import { SecondaryCode, EmdnCode } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import ClinicalIndications from './ClinicalIndications';

interface GmdnDetailProps {
  gmdnCode: SecondaryCode | null;
  allEmdnCodes: EmdnCode[];
  onSelectEmdn: (code: string) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    // Helper to avoid rendering empty sections
    if (!children) return null;
    const childArray = React.Children.toArray(children);
    if (childArray.every(child => !child || (Array.isArray(child) && child.length === 0))) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-sky-400 mb-2 border-b border-slate-600 pb-2">{title}</h3>
            <div className="text-slate-300 space-y-2 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                {children}
            </div>
        </div>
    );
};

const GmdnDetail: React.FC<GmdnDetailProps> = ({ gmdnCode, allEmdnCodes, onSelectEmdn }) => {
  if (!gmdnCode) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Select a GMDN code to view related EMDN codes</p>
      </div>
    );
  }

  const relatedEmdn = gmdnCode.relatedEmdnCodes
    .map(emdnCode => allEmdnCodes.find(c => c.code === emdnCode))
    .filter((c): c is EmdnCode => c !== undefined);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-white font-mono">{gmdnCode.code}</h2>
        <p className="text-slate-300 mt-1">{gmdnCode.description}</p>
      </div>

      <DetailSection title="Clinical Indications">
        <ClinicalIndications deviceCode={gmdnCode.code} deviceType="gmdn" />
      </DetailSection>
      
      <DetailSection title="External Resources">
        <p className="text-xs text-slate-400 mb-2">
            Search for devices using this GMDN term on various international regulatory databases.
        </p>
        <ul className="list-none pl-0 space-y-2">
            <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-200">GMDN Agency</span>
                <a 
                    href={`https://www.gmdnagency.org/terms/search?query=${encodeURIComponent(gmdnCode.description)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                    aria-label={`Search for ${gmdnCode.description} on GMDN Agency`}
                >
                    <span>Search Term</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
            </li>
            <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-200">FDA GUDID (USA)</span>
                <a 
                    href={`https://accessgudid.fda.gov/devices/search?query=${encodeURIComponent(gmdnCode.description)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                    aria-label={`Search for ${gmdnCode.description} on FDA GUDID (USA)`}
                >
                    <span>Search Term</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
            </li>
            <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-200">TGA ARTG (Australia)</span>
                <a 
                    href={`https://www.tga.gov.au/resources/artg?search_api_views_fulltext=${encodeURIComponent(gmdnCode.description)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                    aria-label={`Search for ${gmdnCode.description} on TGA ARTG (Australia)`}
                >
                    <span>Search Term</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
            </li>
        </ul>
      </DetailSection>

      <DetailSection title="Related EMDN Codes">
        {relatedEmdn.length > 0 ? (
          <ul className="list-none pl-0 space-y-2">
            {relatedEmdn.map(emdn => (
              <li key={emdn.code} className="p-3 bg-slate-700/50 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-grow">
                  <span className="font-mono text-md text-sky-400">{emdn.code}</span>
                  <p className="text-slate-300 mt-1 text-sm">{emdn.description}</p>
                </div>
                <button 
                  onClick={() => onSelectEmdn(emdn.code)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors flex-shrink-0"
                >
                  View Full EMDN Details &amp; Reimbursement
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No direct EMDN cross-references found in the dataset for this GMDN code.</p>
        )}
      </DetailSection>
    </div>
  );
};

export default GmdnDetail;