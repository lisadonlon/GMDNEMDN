import React, { useState, useEffect } from 'react';
import { loadAllIcdCodes, searchIcdCodes, IcdCode } from '../data/icdData';
import { 
  loadSemanticRelationships, 
  getDevicesForIcdCode, 
  getSemanticStatistics,
  DeviceMatch 
} from '../data/semanticRelationships';
import { EmdnCode, SecondaryCode } from '../types';

interface IcdSearchEnhancedProps {
  emdnData: EmdnCode[];
  gmdnData: SecondaryCode[];
  onSelectEmdn: (code: string) => void;
  onSelectGmdn: (code: string) => void;
  className?: string;
}

const IcdSearchEnhanced: React.FC<IcdSearchEnhancedProps> = ({
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
  const [deviceResults, setDeviceResults] = useState<DeviceMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [icdLoading, setIcdLoading] = useState(true);
  const [semanticLoading, setSemanticLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semanticStats, setSemanticStats] = useState<any>(null);

  // Load ICD codes and semantic relationships on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIcdLoading(true);
        setSemanticLoading(true);
        
        // Load ICD codes
        const codes = await loadAllIcdCodes();
        setAvailableIcdCodes(codes);
        setFilteredIcdCodes(codes.slice(0, 100)); // Show first 100 by default
        
        // Load semantic relationships
        await loadSemanticRelationships();
        const stats = getSemanticStatistics();
        setSemanticStats(stats);
        
        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load ICD codes or semantic mappings.');
      } finally {
        setIcdLoading(false);
        setSemanticLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter ICD codes based on search query
  useEffect(() => {
    const filterCodes = async () => {
      let results: IcdCode[] = [];
      
      if (searchQuery.trim()) {
        try {
          results = await searchIcdCodes(searchQuery, 50);
        } catch (err) {
          console.error('Search failed:', err);
          results = [];
        }
      } else {
        results = availableIcdCodes.slice(0, 100);
      }

      setFilteredIcdCodes(results);
    };

    filterCodes();
  }, [searchQuery, availableIcdCodes]);

  const handleIcdSelect = async (code: string, title: string) => {
    setSelectedIcdCode(code);
    setSelectedIcdTitle(title);
    setLoading(true);

    try {
      // Get devices related to this ICD code using semantic relationships
      const relatedDevices = getDevicesForIcdCode(code);
      setDeviceResults(relatedDevices);
    } catch (err) {
      console.error('Failed to get device relationships:', err);
      setDeviceResults([]);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '👤 Expert';
      case 'expert': return '🎯 Curated';
      case 'auto': return '🤖 AI';
      default: return '📊 System';
    }
  };

  if (icdLoading || semanticLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">
            {icdLoading ? 'Loading ICD codes...' : 'Loading semantic relationships...'}
          </div>
          {semanticStats && (
            <div className="text-slate-500 text-sm mt-2">
              {semanticStats.totalEmdnMappings + semanticStats.totalGmdnMappings} device mappings available
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg mb-2">⚠️ Data Loading Error</div>
          <div className="text-slate-400 text-sm mb-4">{error}</div>
          <div className="text-slate-500 text-xs">
            Ensure ICD chunks and mapping files are available.
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
            <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center">
              🩺 ICD-10 Clinical Diagnosis
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              Browse {availableIcdCodes.length} ICD-10 diagnostic codes with semantic device mappings.
            </p>
            {semanticStats && (
              <div className="text-xs text-slate-500 bg-slate-800 rounded p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>📋 {semanticStats.totalEmdnMappings} EMDN mappings</div>
                  <div>🔧 {semanticStats.totalGmdnMappings} GMDN mappings</div>
                  <div>🎯 {semanticStats.highConfidenceMappings} high confidence</div>
                  <div>📊 {semanticStats.totalIcdCodes} ICD codes mapped</div>
                </div>
              </div>
            )}
          </div>

          {/* Search Control */}
          <input
            type="text"
            placeholder="Search ICD-10 codes and diagnoses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* ICD Code List */}
          <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-800 rounded-lg p-4">
            {filteredIcdCodes.length > 0 ? (
              filteredIcdCodes.map((icd) => {
                const hasDevices = getDevicesForIcdCode(icd.code).length > 0;
                return (
                  <button
                    key={icd.code}
                    onClick={() => handleIcdSelect(icd.code, icd.title)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      selectedIcdCode === icd.code
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : hasDevices
                        ? 'bg-slate-700 hover:bg-slate-600 border-green-500/30 text-slate-200'
                        : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-slate-500 text-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm text-blue-400">{icd.code}</div>
                        {hasDevices && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-green-500/20 text-green-300 px-1 rounded">
                              {getDevicesForIcdCode(icd.code).length} devices
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm line-clamp-2">{icd.title}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                {searchQuery ? 'No matching ICD codes found.' : 'No ICD codes available.'}
              </div>
            )}
          </div>

          {selectedIcdCode && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-blue-500/30">
              <h4 className="font-semibold text-slate-200 mb-2">Selected Diagnosis</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-slate-300">ICD-10 Code: </span>
                  <span className="text-sm text-blue-400 font-mono">{selectedIcdCode}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Diagnosis: </span>
                  <span className="text-sm text-slate-200">{selectedIcdTitle}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-300">Related Devices: </span>
                  <span className="text-sm text-green-400">{deviceResults.length} found</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Device Results Panel */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              🏥 Related Medical Devices
            </h3>
            {selectedIcdCode ? (
              <p className="text-sm text-slate-400 mb-4">
                Devices semantically linked to: <span className="text-blue-400 font-mono">{selectedIcdCode}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                Select an ICD-10 diagnostic code to see semantically related medical devices.
              </p>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <div className="text-slate-400 text-sm mt-2">Finding related devices...</div>
            </div>
          )}

          {!loading && deviceResults.length > 0 && (
            <div className="space-y-4">
              {/* Group by device type */}
              {['emdn', 'gmdn'].map(deviceType => {
                const devicesOfType = deviceResults.filter(d => d.type === deviceType);
                if (devicesOfType.length === 0) return null;

                return (
                  <div key={deviceType}>
                    <h4 className="text-sm font-semibold text-sky-400 mb-3 flex items-center">
                      <span className={`px-2 py-1 rounded text-xs mr-2 ${
                        deviceType === 'emdn' 
                          ? 'bg-sky-500/20 text-sky-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {deviceType.toUpperCase()}
                      </span>
                      {devicesOfType.length} device{devicesOfType.length !== 1 ? 's' : ''}
                    </h4>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {devicesOfType
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((device, index) => {
                          const deviceInfo = getDeviceInfo(device.code, device.type);
                          const onSelectDevice = device.type === 'emdn' ? onSelectEmdn : onSelectGmdn;
                          
                          return (
                            <button
                              key={`${device.type}-${device.code}-${index}`}
                              onClick={() => onSelectDevice(device.code)}
                              className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className={`font-mono text-sm ${
                                      device.type === 'emdn' ? 'text-sky-300' : 'text-green-300'
                                    }`}>
                                      {device.code}
                                    </div>
                                    <div className={`text-xs ${getConfidenceColor(device.confidence)}`}>
                                      {device.confidence}%
                                    </div>
                                  </div>
                                  <div className="text-slate-300 text-sm line-clamp-2">
                                    {deviceInfo ? deviceInfo.description : device.term || 'Device description not available'}
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="text-xs text-slate-500">
                                      {getSourceIcon(device.source)}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      Click to view details →
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && selectedIcdCode && deviceResults.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm bg-slate-800 border border-slate-600 rounded-lg p-4">
                <div className="text-slate-300 mb-2">🔍 No Semantic Mappings Found</div>
                No medical devices are currently mapped to "{selectedIcdCode}".
                <div className="mt-3 text-xs text-slate-500">
                  <div>Available mappings: {semanticStats?.totalIcdCodes || 0} ICD codes</div>
                  <div>Total device relationships: {
                    (semanticStats?.totalEmdnMappings || 0) + (semanticStats?.totalGmdnMappings || 0)
                  }</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IcdSearchEnhanced;