import React, { useState, useEffect } from 'react';
import { SecondaryCode, EmdnCode } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { 
  externalGmdnEmdnMapper, 
  type GmdnEmdnMatch 
} from '../data/externalGmdnEmdnMapper';
import { isFeatureEnabled } from '../config/features';

interface GmdnDetailEnhancedProps {
  gmdnCode: SecondaryCode | null;
  allEmdnCodes: EmdnCode[];
  onSelectEmdn: (code: string) => void;
}

const GmdnDetailEnhanced: React.FC<GmdnDetailEnhancedProps> = ({ 
  gmdnCode, 
  allEmdnCodes, 
  onSelectEmdn 
}) => {
  const [loading, setLoading] = useState(false);
  const [relatedEmdnCodes, setRelatedEmdnCodes] = useState<EmdnCode[]>([]);
  const [externalMatches, setExternalMatches] = useState<GmdnEmdnMatch[]>([]);

  // Load external GMDN-EMDN mappings when gmdnCode changes
  useEffect(() => {
    if (gmdnCode) {
      setLoading(true);
      
      const loadExternalMappings = async () => {
        try {
          // Ensure external mappings are loaded
          await externalGmdnEmdnMapper.loadMappings();
          
          const externalData = await externalGmdnEmdnMapper.getEmdnCodesForGmdn(gmdnCode.code);
          setExternalMatches(externalData);
          
          // Find EMDN codes from external mappings
          const externalEmdnCodes = externalData
            .map((match: GmdnEmdnMatch) => allEmdnCodes.find(emdn => emdn.code === match.emdnCode))
            .filter((emdn: EmdnCode | undefined): emdn is EmdnCode => emdn !== undefined);
          
          setRelatedEmdnCodes(externalEmdnCodes);
        } catch (error) {
          console.error('Failed to load external mappings:', error);
          setRelatedEmdnCodes([]);
        }
        
        setLoading(false);
      };
      
      loadExternalMappings();
    } else {
      setRelatedEmdnCodes([]);
      setExternalMatches([]);
    }
  }, [gmdnCode, allEmdnCodes]);

  if (!gmdnCode) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a GMDN Code</h3>
          <p className="text-sm">Choose a device from the list to view detailed information and related EMDN codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GMDN Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-6 border border-emerald-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-300 mb-2">{gmdnCode.code}</h2>
            <p className="text-lg text-slate-200 leading-relaxed">{gmdnCode.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Global Standard</div>
            <div className="text-lg font-semibold text-emerald-400">GMDN</div>
          </div>
        </div>
        
        <div className="text-sm text-slate-300">
          <span className="text-slate-400">From:</span>
          <span className="ml-2">FDA GUDID Database</span>
        </div>
      </div>

      {/* Clinical Indications - ICD-10 (Hidden in production until data is more complete) */}
      {isFeatureEnabled('icdClinicalIndications') && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
            🩺 Clinical Indications (ICD-10)
            {loading && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>}
          </h3>
          
          <div className="text-slate-400 text-sm bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <span>🔍</span>
              <span>ICD-10 clinical indication mappings coming soon</span>
            </div>
            <div className="text-xs text-slate-500">
              Advanced semantic matching features are in development.
            </div>
          </div>
        </div>
      )}

      {/* Related EMDN Codes - External Mapping System */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
          🔗 Related European (EMDN) Codes
          {loading && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>}
        </h3>
        
        {relatedEmdnCodes.length > 0 ? (
          <div className="space-y-3">
            {relatedEmdnCodes.map((emdn) => {
              // Find corresponding external match for this EMDN code
              const externalMatch = externalMatches.find(match => match.emdnCode === emdn.code);
              
              return (
                <div 
                  key={emdn.code}
                  className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <code className="text-sky-400 font-mono text-sm">{emdn.code}</code>
                      {externalMatch && (
                        <span className={`text-xs px-2 py-1 rounded border ${
                          externalMatch.source === 'manual' 
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {externalMatch.source === 'manual' ? 'Expert Match' : `Auto ${externalMatch.score}%`}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-200 text-sm">{emdn.description}</div>
                    {externalMatch && (
                      <div className="text-xs text-slate-400 mt-1">
                        {externalMatch.source === 'manual' ? 'Curated expert mapping' : 'Automatic semantic mapping'}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onSelectEmdn(emdn.code)}
                    className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                  >
                    View EMDN Details
                  </button>
                </div>
              );
            })}
            
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-xs text-blue-300 mb-1">🧠 External Mapping System</div>
              <div className="text-xs text-slate-400">
                EMDN codes are matched using pre-generated mappings with expert curation and automatic semantic analysis for comprehensive cross-referencing.
              </div>
              {externalMatches.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  Manual matches: {externalMatches.filter(m => m.source === 'manual').length}, 
                  Automatic matches: {externalMatches.filter(m => m.source === 'automatic').length}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center space-x-2 mb-2">
              <span>🔍</span>
              <span>No related EMDN codes found</span>
            </div>
            <div className="text-xs text-slate-500">
              This GMDN device is not currently mapped to EMDN codes in our external mapping database.
              This may be a specialized device category or may need additional mapping coverage.
            </div>
          </div>
        )}
      </div>

      {/* External Resources */}
      {isFeatureEnabled('externalResources') && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">🌐 External Resources</h3>
          <p className="text-xs text-slate-400 mb-4">
            Search for devices using this GMDN term on various international regulatory databases.
            <strong className="text-yellow-400 ml-1">Note:</strong> Results may vary based on exact terminology matching.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">GMDN Agency</span>
                <a 
                  href={`https://www.gmdnagency.org/terms/search?query=${encodeURIComponent(gmdnCode.description)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span>Search</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-xs text-slate-500 mt-1">Official GMDN terminology database</div>
            </div>
            
            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">FDA GUDID (USA)</span>
                <a 
                  href={`https://accessgudid.fda.gov/devices/search?query=${encodeURIComponent(gmdnCode.description)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span>Search</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-xs text-slate-500 mt-1">US FDA device database</div>
            </div>
            
            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">TGA ARTG (Australia)</span>
                <a 
                  href={`https://www.tga.gov.au/resources/artg?search_api_views_fulltext=${encodeURIComponent(gmdnCode.description)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span>Search</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-xs text-slate-500 mt-1">Australian therapeutic goods registry</div>
            </div>
            
            <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">EUDAMED (EU)</span>
                <a 
                  href={`https://ec.europa.eu/tools/eudamed/#/screen/search-device`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <span>Search</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-xs text-slate-500 mt-1">European medical device database</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-xs text-yellow-300 mb-1">⚠️ External Search Disclaimer</div>
            <div className="text-xs text-slate-400">
              External database searches use the GMDN device description and may not always return relevant results. 
              Terminology variations and regional differences may affect search accuracy.
            </div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">📋 Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">GMDN Code:</span>
              <span className="ml-2 text-slate-200 font-mono">{gmdnCode.code}</span>
            </div>
            <div>
              <span className="text-slate-400">Source:</span>
              <span className="ml-2 text-slate-200">FDA GUDID Database</span>
            </div>
            <div>
              <span className="text-slate-400">Standard:</span>
              <span className="ml-2 text-slate-200">Global Medical Device Nomenclature</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">External Mappings:</span>
              <span className="ml-2 text-slate-200">{externalMatches.length} pre-generated</span>
            </div>
            <div>
              <span className="text-slate-400">Related EMDN:</span>
              <span className="ml-2 text-slate-200">{relatedEmdnCodes.length} matched codes</span>
            </div>
            <div>
              <span className="text-slate-400">Mapping Source:</span>
              <span className="ml-2 text-slate-200">Expert Curation + Automated Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GmdnDetailEnhanced;