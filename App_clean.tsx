import React, { useState, useMemo, useEffect } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { EmdnCode, SecondaryCode } from './types';
import { countryData } from './data/countryData';
import { loadAllEMDNData } from './data/emdnChunkedData';
import { gmdnFromGUDID } from './data/gmdnFromGUDID';
import Header from './components/Header';
import CountryList from './components/CountryList';
import CountryDetail from './components/CountryDetail';
import SearchBar from './components/SearchBar';
import ViewSwitcher from './components/ViewSwitcher';
import EmdnList from './components/EmdnList';
import EmdnDetailEnhanced from './components/EmdnDetailEnhanced';
import GmdnList from './components/GmdnList';
import GmdnDetail from './components/GmdnDetail';

type View = 'countries' | 'emdn' | 'gmdn';

const App: React.FC = () => {
  const [view, setView] = useState<View>('countries');
  
  // EMDN data state
  const [emdnData, setEmdnData] = useState<EmdnCode[]>([]);
  const [emdnDataLoading, setEmdnDataLoading] = useState(true);
  
  // Country state
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>('germany');

  // EMDN state
  const [emdnSearchTerm, setEmdnSearchTerm] = useState('');
  const [selectedEmdnCode, setSelectedEmdnCode] = useState<string | null>(null);

  // GMDN state
  const [gmdnSearchTerm, setGmdnSearchTerm] = useState('');
  const [selectedGmdnCode, setSelectedGmdnCode] = useState<string | null>(null);

  // Load EMDN data on component mount
  useEffect(() => {
    const loadEMDN = async () => {
      try {
        setEmdnDataLoading(true);
        const data = await loadAllEMDNData();
        setEmdnData(data);
      } catch (error) {
        console.error('Failed to load EMDN data:', error);
      } finally {
        setEmdnDataLoading(false);
      }
    };

    loadEMDN();
  }, []);

  // Handle view changes and reset selections appropriately
  const handleViewChange = (newView: View) => {
    if (newView !== view) {
      setView(newView);
      
      // Reset selections when switching views
      if (newView === 'countries') {
        setSelectedCountryId('germany');
      } else if (newView === 'emdn') {
        setSelectedEmdnCode(null);
      } else if (newView === 'gmdn') {
        setSelectedGmdnCode(null);
      }
    }
  };

  // Country-related handlers
  const handleCountrySelectEmdn = (emdnCode: string) => {
    setView('emdn');
    setSelectedEmdnCode(emdnCode);
  };

  // GMDN-related handlers
  const handleGmdnSelectEmdn = (emdnCode: string) => {
    setView('emdn');
    setSelectedEmdnCode(emdnCode);
  };

  const handleEmdnSelectGmdn = (gmdnCode: string) => {
    setView('gmdn');
    setSelectedGmdnCode(gmdnCode);
  };

  // Create search instances
  const countryFuse = useMemo(() => {
    const options: IFuseOptions<typeof countryData[0]> = {
      keys: ['name', 'region', 'primaryHTAAgencies', 'codingRequirements'],
      threshold: 0.3,
      includeScore: true,
    };
    return new Fuse(countryData, options);
  }, []);

  const emdnFuse = useMemo(() => {
    if (emdnData.length === 0) return null;
    const options: IFuseOptions<EmdnCode> = {
      keys: ['code', 'description'],
      threshold: 0.3,
      includeScore: true,
    };
    return new Fuse(emdnData, options);
  }, [emdnData]);

  const gmdnFuse = useMemo(() => {
    const options: IFuseOptions<SecondaryCode> = {
      keys: ['code', 'description'],
      threshold: 0.3,
      includeScore: true,
    };
    return new Fuse(gmdnFromGUDID, options);
  }, []);

  // Get filtered results
  const filteredCountries = useMemo(() => {
    if (!countrySearchTerm.trim()) return countryData;
    return countryFuse.search(countrySearchTerm).map(result => result.item);
  }, [countrySearchTerm, countryFuse]);

  const filteredEmdnCodes = useMemo(() => {
    if (!emdnSearchTerm.trim() || !emdnFuse) return emdnData;
    return emdnFuse.search(emdnSearchTerm).map(result => result.item);
  }, [emdnSearchTerm, emdnFuse, emdnData]);

  const filteredGmdnCodes = useMemo(() => {
    if (!gmdnSearchTerm.trim()) return gmdnFromGUDID;
    return gmdnFuse.search(gmdnSearchTerm).map(result => result.item);
  }, [gmdnSearchTerm, gmdnFuse]);

  // Get selected items
  const selectedCountry = countryData.find(country => country.id === selectedCountryId) || null;
  const selectedEmdn = emdnData.find(code => code.code === selectedEmdnCode) || null;
  const selectedGmdn = gmdnFromGUDID.find(code => code.code === selectedGmdnCode) || null;

  const renderLeftPanel = () => {
    switch (view) {
      case 'countries':
        return (
          <>
            <SearchBar
              searchTerm={countrySearchTerm}
              onSearchChange={setCountrySearchTerm}
              placeholder="Search countries..."
            />
            <div className="flex-1 overflow-y-auto">
              <CountryList 
                countries={filteredCountries}
                selectedCountryId={selectedCountryId}
                onSelectCountry={setSelectedCountryId}
              />
            </div>
          </>
        );
      case 'emdn':
        return (
          <>
            <SearchBar
              searchTerm={emdnSearchTerm}
              onSearchChange={setEmdnSearchTerm}
              placeholder="Search EMDN codes..."
            />
            <div className="flex-1 overflow-y-auto">
              {emdnDataLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-2"></div>
                    <p>Loading EMDN data...</p>
                  </div>
                </div>
              ) : (
                <EmdnList 
                  codes={filteredEmdnCodes}
                  selectedCode={selectedEmdnCode}
                  onSelectCode={setSelectedEmdnCode}
                />
              )}
            </div>
          </>
        );
      case 'gmdn':
        return (
          <>
            <SearchBar
              searchTerm={gmdnSearchTerm}
              onSearchChange={setGmdnSearchTerm}
              placeholder="Search GMDN codes..."
            />
            <div className="flex-1 overflow-y-auto">
              <GmdnList 
                codes={filteredGmdnCodes}
                selectedCode={selectedGmdnCode}
                onSelectCode={setSelectedGmdnCode}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderRightPanel = () => {
    switch (view) {
      case 'countries':
        return (
          <CountryDetail 
            country={selectedCountry}
            onSelectEmdn={handleCountrySelectEmdn}
          />
        );
      case 'emdn':
        return (
          <EmdnDetailEnhanced 
            code={selectedEmdn} 
            allCodes={emdnData}
            allGmdnCodes={gmdnFromGUDID}
            onSelectGmdn={handleEmdnSelectGmdn}
          />
        );
      case 'gmdn':
        return (
          <GmdnDetail 
            gmdnCode={selectedGmdn}
            allEmdnCodes={emdnData}
            onSelectEmdn={handleGmdnSelectEmdn}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <ViewSwitcher currentView={view} onViewChange={handleViewChange} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6">
          <div className="md:col-span-1 lg:col-span-1 h-[calc(100vh-180px)] flex flex-col">
            {renderLeftPanel()}
          </div>
          <div className="md:col-span-2 lg:col-span-3 h-[calc(100vh-180px)] overflow-y-auto bg-slate-800 rounded-lg shadow-lg p-6">
              {renderRightPanel()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;