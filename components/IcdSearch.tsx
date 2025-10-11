import React, { useState, useEffect } from 'react';
import { searchDevicesByIcd } from '../data/icd10Utils';
import { loadAllIcdCodes, searchIcdCodes, IcdCode } from '../data/icdData';
import { EmdnCode, SecondaryCode } from '../types';

interface IcdSearchProps {
  emdnData: EmdnCode[];
  gmdnData: SecondaryCode[];
  onSelectEmdn: (code: string) => void;
  onSelectGmdn: (code: string) => void;
  className?: string;
}

const IcdSearch: React.FC<IcdSearchProps> = ({
  emdnData,
  gmdnData,
  onSelectEmdn,
  onSelectGmdn,
  className = ''
}) => {
  const [availableIcdCodes, setAvailableIcdCodes] = useState<IcdCode[]>([]);
  const [filteredIcdCodes, setFilteredIcdCodes] = useState<IcdCode[]>([]);
  const [selectedIcdCode, setSelectedIcdCode] = useState<string>('');
  const [selectedIcdTitle, setSelectedIcdTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{emdn: string[], gmdn: string[]}>({ emdn: [], gmdn: [] });
  const [loading, setLoading] = useState(false);
  const [icdLoading, setIcdLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ICD codes on component mount
  useEffect(() => {
    const loadIcdCodes = async () => {
      try {
        setIcdLoading(true);
        const codes = await loadAllIcdCodes();
        setAvailableIcdCodes(codes);
        setFilteredIcdCodes(codes);
        setError(null);
      } catch (err) {
        console.error('Failed to load ICD codes:', err);
        setError('Failed to load ICD codes. Please ensure the ICD data has been generated.');
      } finally {
        setIcdLoading(false);
      }
    };

    loadIcdCodes();
  }, []);

  // Filter ICD codes based on search query
  useEffect(() => {
    const filterCodes = async () => {
      if (searchQuery.trim()) {
        try {
          const results = await searchIcdCodes(searchQuery, 20);
          setFilteredIcdCodes(results);
        } catch (err) {
          console.error('Search failed:', err);
          setFilteredIcdCodes([]);
        }
      } else {
        setFilteredIcdCodes(availableIcdCodes);
      }
    };

    filterCodes();
  }, [searchQuery, availableIcdCodes]);

  const handleCodeSelect = async (code: string, title: string) => {
    setSelectedIcdCode(code);
    setSelectedIcdTitle(title);
    setLoading(true);

    try {
      const results = await searchDevicesByIcd(code);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults({ emdn: [], gmdn: [] });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceInfo = (code: string, type: 'emdn' | 'gmdn') => {
    if (type === 'emdn') {
      return emdnData.find(d => d.code === code);
    } else {
      return gmdnData.find(d => d.code === code);
    }
  };

  if (icdLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Loading ICD-10 data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg mb-2">⚠️ ICD Data Not Available</div>
          <div className="text-slate-400 text-sm mb-4">{error}</div>
          <div className="text-slate-500 text-xs">
            Run <code className="bg-slate-800 px-1 rounded">node fetch-and-chunk-icd.cjs</code> to generate ICD data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICD Code Selection Panel */}
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              ICD-10 Clinical Indications
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Browse {availableIcdCodes.length} ICD-10 codes from WHO API. Select a condition to find related medical devices.
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search ICD codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ICD Code List */}
          <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-800 rounded-lg p-4">
            {filteredIcdCodes.length > 0 ? (
              filteredIcdCodes.map((icdCode) => (
                <button
                  key={icdCode.id}
                  onClick={() => handleCodeSelect(icdCode.code, icdCode.title)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedIcdCode === icdCode.code
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-blue-400">{icdCode.code}</div>
                    <div className="text-sm line-clamp-2">{icdCode.title}</div>
                    {icdCode.definition && (
                      <div className="text-xs text-slate-400 line-clamp-1">{icdCode.definition}</div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                {searchQuery ? 'No matching ICD codes found.' : 'No ICD codes available.'}
              </div>
            )}
          </div>

          {selectedIcdCode && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-blue-500/30">
              <h4 className="font-semibold text-slate-200 mb-2">Selected Condition</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-300">ICD Code: </span>
                  <span className="text-sm text-blue-400 font-mono">{selectedIcdCode}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Condition: </span>
                  <span className="text-sm text-slate-200">{selectedIcdTitle}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Related Medical Devices
            </h3>
            {selectedIcdCode ? (
              <p className="text-sm text-slate-400 mb-4">
                Devices for condition: <span className="text-blue-400 font-mono">{selectedIcdCode}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                Select an ICD code to see related medical devices.
              </p>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <div className="text-slate-400 text-sm mt-2">Searching devices...</div>
            </div>
          )}

          {!loading && (searchResults.emdn.length > 0 || searchResults.gmdn.length > 0) && (
            <div className="space-y-4">
              {/* EMDN Results */}
              {searchResults.emdn.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center">
                    <span className="bg-sky-500/20 text-sky-300 px-2 py-1 rounded text-xs mr-2">EMDN</span>
                    {searchResults.emdn.length} device{searchResults.emdn.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.emdn.map(code => {
                      const device = getDeviceInfo(code, 'emdn');
                      return device ? (
                        <button
                          key={code}
                          onClick={() => onSelectEmdn(code)}
                          className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm text-sky-300 mb-1">{device.code}</div>
                              <div className="text-slate-300 text-sm line-clamp-2">
                                {device.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* GMDN Results */}
              {searchResults.gmdn.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center">
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs mr-2">GMDN</span>
                    {searchResults.gmdn.length} device{searchResults.gmdn.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.gmdn.map(code => {
                      const device = getDeviceInfo(code, 'gmdn');
                      return device ? (
                        <button
                          key={code}
                          onClick={() => onSelectGmdn(code)}
                          className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm text-green-300 mb-1">{device.code}</div>
                              <div className="text-slate-300 text-sm line-clamp-2">
                                {device.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && selectedIcdCode && searchResults.emdn.length === 0 && searchResults.gmdn.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm bg-slate-800 border border-slate-600 rounded-lg p-4">
                No devices found for "{selectedIcdCode}". Device mappings may not be available for this ICD code yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IcdSearch;