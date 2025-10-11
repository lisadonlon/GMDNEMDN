import React, { useState, useEffect } from 'react';
import { IcdIndication } from '../types';
import { getClinicalSummary, groupIndicationsByChapter } from '../data/icd10Utils';
import { InfoIcon } from './icons/InfoIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface ClinicalIndicationsProps {
  deviceCode: string;
  deviceType: 'emdn' | 'gmdn';
  className?: string;
}

const ClinicalIndications: React.FC<ClinicalIndicationsProps> = ({ 
  deviceCode, 
  deviceType, 
  className = '' 
}) => {
  const [clinicalSummary, setClinicalSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllIndications, setShowAllIndications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClinicalData = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await getClinicalSummary(deviceCode, deviceType);
        setClinicalSummary(summary);
      } catch (err) {
        console.warn('Failed to load clinical data:', err);
        setError('Clinical indications not available');
      } finally {
        setLoading(false);
      }
    };

    loadClinicalData();
  }, [deviceCode, deviceType]);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-600 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !clinicalSummary) {
    return (
      <div className={`${className} text-slate-500 text-sm`}>
        <div className="flex items-center gap-2">
          <InfoIcon className="w-4 h-4" />
          <span>Clinical indications not available</span>
        </div>
      </div>
    );
  }

  const { totalIndications, highConfidence, manualMappings, primaryIndications, allIndications } = clinicalSummary;
  const groupedIndications = groupIndicationsByChapter(allIndications);

  const getConfidenceBadge = (confidence: number, source: string) => {
    if (source === 'manual') {
      return <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded">Expert</span>;
    }
    if (confidence >= 80) {
      return <span className="text-xs bg-blue-600 text-white px-1 py-0.5 rounded">High</span>;
    }
    if (confidence >= 60) {
      return <span className="text-xs bg-yellow-600 text-white px-1 py-0.5 rounded">Medium</span>;
    }
    return <span className="text-xs bg-slate-600 text-white px-1 py-0.5 rounded">Low</span>;
  };

  const getIcdUrl = (code: string) => `https://icd.who.int/browse10/2019/en#/${code}`;

  return (
    <div className={className}>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
            <InfoIcon className="w-4 h-4" />
            Clinical Indications
          </h4>
          <div className="text-xs text-slate-400">
            ICD-10 • {totalIndications} indication{totalIndications !== 1 ? 's' : ''}
          </div>
        </div>
        
        {totalIndications > 0 && (
          <div className="text-xs text-slate-500 mb-3">
            {highConfidence > 0 && (
              <span className="mr-3">
                {highConfidence} high-confidence
              </span>
            )}
            {manualMappings > 0 && (
              <span className="mr-3">
                {manualMappings} expert-curated
              </span>
            )}
          </div>
        )}
      </div>

      {/* Primary indications (top 3 high-confidence) */}
      {primaryIndications.length > 0 && (
        <div className="space-y-2 mb-3">
          {primaryIndications.map((indication: IcdIndication, index: number) => (
            <div key={`${indication.code}-${index}`} className="flex items-start justify-between text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sky-300 font-mono text-xs">{indication.code}</code>
                  {getConfidenceBadge(indication.confidence, indication.source)}
                </div>
                <div className="text-slate-300 text-xs leading-relaxed">
                  {indication.indication}
                </div>
              </div>
              <a
                href={getIcdUrl(indication.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-slate-400 hover:text-sky-400 transition-colors"
                title="View in WHO ICD-10"
              >
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Show more toggle for additional indications */}
      {allIndications.length > primaryIndications.length && (
        <div className="mt-3">
          <button
            onClick={() => setShowAllIndications(!showAllIndications)}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            {showAllIndications ? 'Show less' : `Show ${allIndications.length - primaryIndications.length} more indication${allIndications.length - primaryIndications.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* All indications grouped by chapter */}
      {showAllIndications && (
        <div className="mt-4 space-y-3 border-t border-slate-600 pt-3">
          {Object.entries(groupedIndications).map(([chapterCode, { chapter, indications }]) => (
            <div key={chapterCode}>
              <h5 className="text-xs font-medium text-slate-400 mb-2">
                {chapter}
              </h5>
              <div className="space-y-2 ml-2">
                {indications.map((indication: IcdIndication, index: number) => (
                  <div key={`${indication.code}-${index}`} className="flex items-start justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sky-300 font-mono text-xs">{indication.code}</code>
                        {getConfidenceBadge(indication.confidence, indication.source)}
                      </div>
                      <div className="text-slate-300 text-xs leading-relaxed">
                        {indication.indication}
                      </div>
                    </div>
                    <a
                      href={getIcdUrl(indication.code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-slate-400 hover:text-sky-400 transition-colors"
                      title="View in WHO ICD-10"
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalIndications;