import React, { useEffect, useState } from 'react';
import { TermsLink } from './TermsModal';
import { externalGmdnEmdnMapper } from '../data/externalGmdnEmdnMapper';

interface FooterProps {
  onShowTerms: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowTerms }) => {
  const [validatedMappings, setValidatedMappings] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        await externalGmdnEmdnMapper.loadMappings();
        if (!isMounted) return;

        const stats = externalGmdnEmdnMapper.getStats();
        if (stats) {
          const count = stats.manualMappings ?? stats.mappedGmdn ?? stats.totalGmdn;
          setValidatedMappings(count ?? null);
        }
      } catch (error) {
        console.error('Failed to load mapping stats for footer:', error);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const mappingLabel = validatedMappings !== null
    ? `${validatedMappings.toLocaleString()} Validated Mappings`
    : 'Validated Mappings';

  return (
    <footer className="bg-slate-800/30 border-t border-slate-700/50 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-slate-400 text-sm">
              © 2025 Donlon Life Science Consulting Limited
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <TermsLink onClick={onShowTerms} />
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{mappingLabel}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Continuously Expanding</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Service Active</span>
            </span>
            <span>•</span>
            <span>medicalcodes.donlonlsc.com</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <p className="text-xs text-slate-500 text-center">
            ⚠️ For reference only. Always verify codes with official regulatory sources before use in submissions.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;