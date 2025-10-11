import React from 'react';
import { EmdnCode } from '../types';

interface EmdnListProps {
  codes: EmdnCode[];
  selectedCode: string | null;
  onSelectCode: (code: string) => void;
}

const getIndentation = (code: string) => {
  if (code.length === 1) return 0; // Category
  if (code.length === 3) return 1; // Group
  if (code.length === 5) return 2; // Type
  if (code.length === 7) return 3; // Term
  return 4;
};

const EmdnList: React.FC<EmdnListProps> = ({ codes, selectedCode, onSelectCode }) => {
  if (codes.length === 0) {
    return <p className="text-slate-500 px-3 text-sm">No matching EMDN codes found.</p>
  }
  
  return (
    <nav>
      <ul>
        {codes.map(code => (
          <li key={code.code}>
            <button
              onClick={() => onSelectCode(code.code)}
              style={{ paddingLeft: `${0.75 + getIndentation(code.code) * 1}rem`}}
              className={`w-full text-left py-1.5 rounded-md text-sm transition-colors duration-150 flex items-start ${
                selectedCode === code.code
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
              }`}
            >
              <span className="font-mono text-xs w-20 flex-shrink-0 text-slate-400">
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

export default EmdnList;
