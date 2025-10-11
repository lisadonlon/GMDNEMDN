import React, { useState, useEffect } from 'react';
import { loadAllIchiEntries, searchIchiEntries, IchiEntry } from '../data/ichiData';
import { EmdnCode, SecondaryCode } from '../types';

interface IchiSearchProps {
  emdnData: EmdnCode[];
  gmdnData: SecondaryCode[];
  onSelectEmdn: (code: string) => void;
  onSelectGmdn: (code: string) => void;
  className?: string;
}

const IchiSearch: React.FC<IchiSearchProps> = ({
  emdnData,
  gmdnData,
  onSelectEmdn,
  onSelectGmdn,
  className = ''
}) => {
  const [availableIchiEntries, setAvailableIchiEntries] = useState<IchiEntry[]>([]);
  const [filteredIchiEntries, setFilteredIchiEntries] = useState<IchiEntry[]>([]);
  const [selectedIchiCode, setSelectedIchiCode] = useState<string>('');
  const [selectedIchiTitle, setSelectedIchiTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{emdn: string[], gmdn: string[]}>({ emdn: [], gmdn: [] });
  const [loading, setLoading] = useState(false);
  const [ichiLoading, setIchiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassKind, setSelectedClassKind] = useState<string>('all');

  // Load ICHI entries on component mount
  useEffect(() => {
    const loadIchiEntries = async () => {
      try {
        setIchiLoading(true);
        const entries = await loadAllIchiEntries();
        setAvailableIchiEntries(entries);
        setFilteredIchiEntries(entries.slice(0, 100)); // Show first 100 by default
        setError(null);
      } catch (err) {
        console.error('Failed to load ICHI entries:', err);
        setError('Failed to load ICHI data. Please ensure the ICHI data has been generated.');
      } finally {
        setIchiLoading(false);
      }
    };

    loadIchiEntries();
  }, []);

  // Filter ICHI entries based on search query and classification
  useEffect(() => {
    const filterEntries = async () => {
      let results: IchiEntry[] = [];
      
      if (searchQuery.trim()) {
        try {
          results = await searchIchiEntries(searchQuery, 50);
        } catch (err) {
          console.error('Search failed:', err);
          results = [];
        }
      } else {
        results = availableIchiEntries.slice(0, 100);
      }

      // Filter by classification kind
      if (selectedClassKind !== 'all') {
        results = results.filter(entry => entry.classKind === selectedClassKind);
      }

      setFilteredIchiEntries(results);
    };

    filterEntries();
  }, [searchQuery, availableIchiEntries, selectedClassKind]);

  const handleEntrySelect = async (code: string, title: string) => {
    setSelectedIchiCode(code);
    setSelectedIchiTitle(title);
    setLoading(true);

    try {
      // No device mappings available yet - ICHI to device mappings not implemented
      setSearchResults({ emdn: [], gmdn: [] });
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

  const getClassKindIcon = (classKind: string) => {
    switch (classKind) {
      case 'chapter': return '📚';
      case 'block': return '🏥';
      case 'category': return '⚕️';
      default: return '📋';
    }
  };

  const getClassKindColor = (classKind: string) => {
    switch (classKind) {
      case 'chapter': return 'text-orange-400';
      case 'block': return 'text-cyan-400';
      case 'category': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const getInterventionType = (title: string) => {
    if (title.includes('surgery') || title.includes('surgical')) return '🔪 Surgery';
    if (title.includes('therapy') || title.includes('treatment')) return '💊 Therapy';
    if (title.includes('imaging') || title.includes('scan')) return '🔍 Imaging';
    if (title.includes('monitoring')) return '📊 Monitoring';
    if (title.includes('biopsy')) return '🧪 Biopsy';
    return '⚕️ Intervention';
  };

  if (ichiLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Loading ICHI data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg mb-2">⚠️ ICHI Data Not Available</div>
          <div className="text-slate-400 text-sm mb-4">{error}</div>
          <div className="text-slate-500 text-xs">
            Run <code className="bg-slate-800 px-1 rounded">node parse-who-csv.cjs data/ichi-data.csv ichi</code> to generate ICHI data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICHI Entry Selection Panel */}
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              ICHI - Health Interventions
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Browse {availableIchiEntries.length} ICHI codes for medical procedures and health interventions.
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search ICHI interventions and procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            
            <select
              value={selectedClassKind}
              onChange={(e) => setSelectedClassKind(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Classifications</option>
              <option value="category">Categories</option>
              <option value="block">Blocks</option>
              <option value="chapter">Chapters</option>
            </select>
          </div>

          {/* ICHI Entry List */}
          <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-800 rounded-lg p-4">
            {filteredIchiEntries.length > 0 ? (
              filteredIchiEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleEntrySelect(entry.code, entry.title)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedIchiCode === entry.code
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm text-orange-400">{entry.code}</div>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs ${getClassKindColor(entry.classKind)}`}>
                          {getClassKindIcon(entry.classKind)} {entry.classKind}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm line-clamp-2">{entry.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">{getInterventionType(entry.title)}</div>
                      {entry.depth > 0 && (
                        <div className="text-xs text-slate-400">Depth: {entry.depth}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                {searchQuery ? 'No matching ICHI entries found.' : 'No ICHI entries available.'}
              </div>
            )}
          </div>

          {selectedIchiCode && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-orange-500/30">
              <h4 className="font-semibold text-slate-200 mb-2">Selected ICHI Intervention</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-300">Code: </span>
                  <span className="text-sm text-orange-400 font-mono">{selectedIchiCode}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Intervention: </span>
                  <span className="text-sm text-slate-200">{selectedIchiTitle}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Type: </span>
                  <span className="text-sm text-slate-300">{getInterventionType(selectedIchiTitle)}</span>
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
            {selectedIchiCode ? (
              <p className="text-sm text-slate-400 mb-4">
                Devices for ICHI: <span className="text-orange-400 font-mono">{selectedIchiCode}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                Select an ICHI intervention to see related medical devices.
              </p>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
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

          {!loading && selectedIchiCode && searchResults.emdn.length === 0 && searchResults.gmdn.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm bg-slate-800 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-300 mb-2">⚠️ Device Mapping Not Available</div>
                ICHI → Device mappings are not yet implemented. The current system supports:
                <ul className="text-left mt-2 space-y-1 text-xs">
                  <li>• Device → ICD-10 mappings (via mapping scripts)</li>
                  <li>• Browse ICHI interventions independently</li>
                  <li>• Cross-reference classifications manually</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IchiSearch;