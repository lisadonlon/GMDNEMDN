import React, { useState } from 'react';
import { EmdnCode } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { InfoIcon } from './icons/InfoIcon';

interface EudamedSearchProps {
  emdnCode: EmdnCode;
}

const EudamedSearch: React.FC<EudamedSearchProps> = ({ emdnCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAndSearch = () => {
    // navigator.clipboard is available in secure contexts (HTTPS)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emdnCode.description).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500); // Reset after 2.5 seconds
      });
    }
    // Always open the window
    window.open('https://ec.europa.eu/tools/eudamed/#/screen/search-device', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-200">Direct Search: The Most Reliable Method</h4>
        <p className="text-sm text-slate-400 mt-1">
          To ensure you always get accurate, up-to-the-minute results, this tool uses a direct link to the official EUDAMED portal. Their advanced security prevents automated searching, so this manual step is the most reliable way to access their data.
        </p>
      </div>

      <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-md">
        <label htmlFor="eudamed-search-term" className="text-xs font-bold uppercase text-slate-500 tracking-wider">1. Search Term to Copy</label>
        <p id="eudamed-search-term" className="text-slate-200 mt-1">{emdnCode.description}</p>
      </div>
      
      <button
        onClick={handleCopyAndSearch}
        className="w-full sm:w-auto px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 flex items-center justify-center space-x-2"
        aria-label="Copy search term and open EUDAMED search in a new tab"
      >
        {copied ? 
          <CheckIcon className="w-5 h-5 text-green-300" /> : 
          <ClipboardIcon className="w-5 h-5" />
        }
        <span>{copied ? 'Copied!' : '2. Copy & Open Search'}</span>
        <ExternalLinkIcon className="w-4 h-4 ml-1 opacity-80" />
      </button>
      
      <div className="mt-6 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm">
        <div className="flex items-start space-x-3">
          <InfoIcon className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-300 font-medium">Is EUDAMED down?</p>
            <p className="text-slate-400 mt-1">
              The official portal can occasionally experience downtime. If the search page doesn't load, you can check their main site below or try again later.
            </p>
            <a href="https://health.ec.europa.eu/medical-devices-eudamed/overview_en" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline text-xs inline-flex items-center space-x-1 mt-2">
              <span>EUDAMED Overview Page</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EudamedSearch;