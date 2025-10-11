import React, { useState, useEffect } from 'react';
import { 
  loadICD11MMSManifest, 
  searchICD11MMSEntries, 
  getICD11MMSEntriesByClassKind,
  ICD11MMSEntry 
} from '../data/icd11MmsData';

interface ICD11MMSSearchProps {
  className?: string;
}

const ICD11MMSSearch: React.FC<ICD11MMSSearchProps> = ({
  className = ''
}) => {
  const [availableEntries, setAvailableEntries] = useState<ICD11MMSEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ICD11MMSEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ICD11MMSEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{emdn: string[], gmdn: string[]}>({ emdn: [], gmdn: [] });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassKind, setSelectedClassKind] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [manifest, setManifest] = useState<any>(null);

  // Load manifest and initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setDataLoading(true);
        const manifestData = await loadICD11MMSManifest();
        setManifest(manifestData);
        
        // Load chapters for browsing
        const chapters = await getICD11MMSEntriesByClassKind('chapter');
        setAvailableEntries(chapters);
        setFilteredEntries(chapters);
        setError(null);
      } catch (err) {
        console.error('Failed to load ICD-11 MMS data:', err);
        setError('Failed to load ICD-11 MMS data. Please ensure the data has been generated.');
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Filter entries based on search query and filters
  useEffect(() => {
    const filterEntries = async () => {
      let results: ICD11MMSEntry[] = [];
      
      if (searchQuery.trim()) {
        try {
          setLoading(true);
          results = await searchICD11MMSEntries(searchQuery, 100);
        } catch (err) {
          console.error('Search failed:', err);
          results = [];
        } finally {
          setLoading(false);
        }
      } else {
        // Show chapters by default, or filtered by class kind
        if (selectedClassKind === 'all') {
          results = availableEntries;
        } else {
          try {
            results = await getICD11MMSEntriesByClassKind(selectedClassKind);
          } catch (err) {
            console.error('Filter failed:', err);
            results = availableEntries;
          }
        }
      }

      // Filter by chapter if selected
      if (selectedChapter !== 'all') {
        results = results.filter(entry => entry.chapterNo === selectedChapter);
      }

      setFilteredEntries(results.slice(0, 200)); // Limit display for performance
    };

    filterEntries();
  }, [searchQuery, availableEntries, selectedClassKind, selectedChapter]);

  const handleEntrySelect = async (entry: ICD11MMSEntry) => {
    setSelectedEntry(entry);
    setLoading(true);

    try {
      // No device mappings available yet - ICD-11 to device mappings not implemented
      setSearchResults({ emdn: [], gmdn: [] });
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults({ emdn: [], gmdn: [] });
    } finally {
      setLoading(false);
    }
  };

  const getClassKindIcon = (classKind: string) => {
    switch (classKind) {
      case 'chapter': return '📚';
      case 'block': return '🔲';
      case 'category': return '🏷️';
      default: return '📄';
    }
  };

  const getClassKindColor = (classKind: string) => {
    switch (classKind) {
      case 'chapter': return 'text-red-400';
      case 'block': return 'text-blue-400';
      case 'category': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getChapterTitle = (chapterNo: string) => {
    const chapter = availableEntries.find(e => e.chapterNo === chapterNo && e.classKind === 'chapter');
    return chapter?.title || `Chapter ${chapterNo}`;
  };

  if (dataLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Loading ICD-11 MMS data...</div>
          <div className="text-slate-500 text-sm mt-2">
            {manifest ? `Loading ${manifest.totalEntries} diagnostic codes...` : 'Initializing...'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg mb-2">⚠️ ICD-11 MMS Data Not Available</div>
          <div className="text-slate-400 text-sm mb-4">{error}</div>
          <div className="text-slate-500 text-xs">
            Run <code className="bg-slate-800 px-1 rounded">node parse-icd11-linearization.cjs data/MMS-file.csv mms</code> to generate ICD-11 MMS data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICD-11 MMS Entry Selection Panel */}
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              ICD-11 MMS - Mortality & Morbidity Statistics
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Browse {manifest?.totalEntries?.toLocaleString()} ICD-11 diagnostic codes for comprehensive disease classification.
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search ICD-11 codes and diagnoses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedClassKind}
                onChange={(e) => setSelectedClassKind(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Classifications</option>
                <option value="chapter">Chapters</option>
                <option value="block">Blocks</option>
                <option value="category">Categories</option>
              </select>
              
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Chapters</option>
                {manifest?.stats?.chapterNumbers?.map((chapterNo: string) => (
                  <option key={chapterNo} value={chapterNo}>
                    Ch {chapterNo} - {getChapterTitle(chapterNo).replace(/^Certain /, '').slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entry List */}
          <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-800 rounded-lg p-4">
            {loading && !filteredEntries.length ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
                <div className="text-slate-400 text-sm">Searching...</div>
              </div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleEntrySelect(entry)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedEntry?.id === entry.id
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm text-red-400">{entry.code || 'No Code'}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${getClassKindColor(entry.classKind)}`}>
                          {getClassKindIcon(entry.classKind)} {entry.classKind}
                        </span>
                        {entry.chapterNo && (
                          <span className="text-xs text-slate-400 bg-slate-600 px-1 rounded">
                            Ch{entry.chapterNo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm line-clamp-2">{entry.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Depth: {entry.depth} | Children: {entry.childrenCount}
                      </div>
                      {entry.primaryTabulation && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-1 rounded">
                          Primary Tabulation
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                {searchQuery ? 'No matching ICD-11 entries found.' : 'No ICD-11 entries available.'}
              </div>
            )}
          </div>

          {selectedEntry && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-red-500/30">
              <h4 className="font-semibold text-slate-200 mb-2">Selected ICD-11 Entry</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-300">Code: </span>
                  <span className="text-sm text-red-400 font-mono">{selectedEntry.code || 'No Code'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Title: </span>
                  <span className="text-sm text-slate-200">{selectedEntry.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Classification: </span>
                  <span className="text-sm text-slate-300">{selectedEntry.classKind} (Depth {selectedEntry.depth})</span>
                </div>
                {selectedEntry.blockId && (
                  <div>
                    <span className="text-sm font-medium text-slate-300">Block: </span>
                    <span className="text-sm text-slate-300">{selectedEntry.blockId}</span>
                  </div>
                )}
                {selectedEntry.primaryTabulation && (
                  <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded inline-block">
                    Primary Tabulation - Used for mortality statistics
                  </div>
                )}
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
            {selectedEntry ? (
              <p className="text-sm text-slate-400 mb-4">
                Devices for ICD-11: <span className="text-red-400 font-mono">{selectedEntry.code || selectedEntry.title}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                Select an ICD-11 diagnostic code to see related medical devices.
              </p>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <div className="text-slate-400 text-sm mt-2">Searching devices...</div>
            </div>
          )}

          {!loading && selectedEntry && searchResults.emdn.length === 0 && searchResults.gmdn.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm bg-slate-800 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-300 mb-2">⚠️ Device Mapping Not Available</div>
                ICD-11 → Device mappings are not yet implemented. The current system supports:
                <ul className="text-left mt-2 space-y-1 text-xs">
                  <li>• Device → ICD-10 mappings (via mapping scripts)</li>
                  <li>• Browse ICD-11 classifications independently</li>
                  <li>• Cross-reference classifications manually</li>
                </ul>
                <div className="mt-3 p-2 bg-slate-700 rounded text-xs">
                  <strong>Available mapping scripts:</strong><br/>
                  • map-emdn-to-icd10.cjs<br/>
                  • map-gmdn-to-icd10.cjs
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ICD11MMSSearch;