import React from 'react';
import { SecondaryCode } from '../types';

interface GmdnListProps {
  codes: SecondaryCode[];
  selectedCode: string | null;
  onSelectCode: (code: string) => void;
}

const GmdnList: React.FC<GmdnListProps> = ({ codes, selectedCode, onSelectCode }) => {
  if (codes.length === 0) {
    return <p className="text-slate-500 px-3 text-sm">No matching GMDN codes found.</p>
  }
  
  return (
    <nav>
      <ul>
        {codes.map(code => (
          <li key={code.code}>
            <button
              onClick={() => onSelectCode(code.code)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 flex items-start ${
                selectedCode === code.code
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
              }`}
            >
              <span className="font-mono text-xs w-16 flex-shrink-0 text-slate-400">
                {selectedCode === code.code ? <span className="text-sky-200">{code.code}</span> : code.code}
              </span>
              <span className="flex-1">{code.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default GmdnList;
