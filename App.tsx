
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
import GmdnDetailEnhanced from './components/GmdnDetailEnhanced';
import { UsageTracker } from './components/UsageTracker';
import { PaymentModal } from './components/PaymentModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AccessCodeModal } from './components/AccessCodeModal';
import TermsModal from './components/TermsModal';
import Footer from './components/Footer';

type View = 'countries' | 'emdn' | 'gmdn';

const App: React.FC = () => {
  const [view, setView] = useState<View>('countries');
  
  // Freemium and feedback state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [feedbackContext] = useState<{
    gmdnCode?: string;
    emdnCode?: string;
    type?: 'error_report' | 'mapping_suggestion';
  }>({});
  
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
        setEmdnData([]); // Fallback to empty array
      } finally {
        setEmdnDataLoading(false);
      }
    };

    loadEMDN();
  }, []);


  // --- Country Logic ---
  const filteredCountries = useMemo(() => {
    if (!countrySearchTerm) {
      return countryData;
    }
    return countryData.filter(country =>
      country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.primaryHTAAgencies?.some(agency => agency.toLowerCase().includes(countrySearchTerm.toLowerCase()))
    );
  }, [countrySearchTerm]);

  const selectedCountry = useMemo(() => {
    return countryData.find(c => c.id === selectedCountryId) || null;
  }, [selectedCountryId]);
  

  // --- EMDN Logic ---
  const emdnFuse = useMemo(() => {
      const options: IFuseOptions<EmdnCode> = {
          keys: ['description', 'code'],
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 2,
      };
      return new Fuse(emdnData, options);
  }, [emdnData]);

  const filteredEmdnCodes = useMemo(() => {
      if (!emdnSearchTerm.trim()) {
          return emdnData;
      }
      const normalizedQuery = emdnSearchTerm.trim().toLowerCase();
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);

      const directMatches = emdnData.filter((code) => {
        const haystack = `${code.code} ${code.description}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });

      const matchedCodes = directMatches.length > 0
        ? directMatches
        : emdnFuse.search(normalizedQuery).map(result => result.item);
      const allVisibleCodes = new Set(matchedCodes.map(c => c.code));
      matchedCodes.forEach(code => {
          let current = code;
          while (current.parentCode) {
              const parent = emdnData.find(p => p.code === current.parentCode);
              if (!parent) break;
              if (allVisibleCodes.has(parent.code)) break;
              allVisibleCodes.add(parent.code);
              current = parent;
          }
      });
      return emdnData.filter(code => allVisibleCodes.has(code.code));

  }, [emdnSearchTerm, emdnFuse, emdnData]);

  const selectedEmdn = useMemo(() => {
    return emdnData.find(c => c.code === selectedEmdnCode) || null;
  }, [selectedEmdnCode]);


  // --- GMDN Logic ---
  const gmdnFuse = useMemo(() => {
    const options: IFuseOptions<SecondaryCode> = {
        keys: ['description', 'code'],
        includeScore: true,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
    };
    return new Fuse(gmdnFromGUDID, options);
  }, []);
  
  const filteredGmdnCodes = useMemo(() => {
      if (!gmdnSearchTerm.trim()) {
          return gmdnFromGUDID;
      }
      const normalizedQuery = gmdnSearchTerm.trim().toLowerCase();
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);

      const directMatches = gmdnFromGUDID.filter((code) => {
        const haystack = `${code.code} ${code.description}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });

      if (directMatches.length > 0) {
        return directMatches;
      }

      return gmdnFuse.search(normalizedQuery).map(result => result.item);
  }, [gmdnSearchTerm, gmdnFuse]);
  
  const selectedGmdn = useMemo(() => {
      return gmdnFromGUDID.find(c => c.code === selectedGmdnCode) || null;
  }, [selectedGmdnCode]);


  // --- View Handlers ---
  const handleViewChange = (newView: View) => {
    setView(newView);
    // Reset selections when switching views for a cleaner experience
    if (newView === 'countries' && !selectedCountryId) {
      setSelectedCountryId('germany');
    }
  }
  
  const handleGmdnSelectEmdn = (emdnCode: string) => {
    setView('emdn');
    setSelectedEmdnCode(emdnCode);
    setEmdnSearchTerm(''); // Optional: clear search to show hierarchy
    setSelectedGmdnCode(null); // Deselect GMDN
  };

  const handleEmdnSelectGmdn = (gmdnCode: string) => {
    setView('gmdn');
    setSelectedGmdnCode(gmdnCode);
    setGmdnSearchTerm('');
  };

  const handleCountrySelectEmdn = (emdnCode: string) => {
    setView('emdn');
    setSelectedEmdnCode(emdnCode);
    setEmdnSearchTerm('');
    // Optionally deselect country or keep it as context
  };


  const renderLeftPanel = () => {
    switch (view) {
      case 'countries':
        return (
          <>
            <SearchBar 
              searchTerm={countrySearchTerm} 
              onSearchChange={setCountrySearchTerm} 
              placeholder="Search country or agency..."
            />
            <div className="flex-grow overflow-y-auto mt-4 pr-2">
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
              placeholder="Search EMDN code or description..."
            />
            <div className="flex-grow overflow-y-auto mt-4 pr-2">
              {emdnDataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-400 text-sm">Loading EMDN data...</div>
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
                placeholder="Search GMDN code or description..."
              />
              <div className="flex-grow overflow-y-auto mt-4 pr-2">
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
          <GmdnDetailEnhanced 
            gmdnCode={selectedGmdn}
            allEmdnCodes={emdnData}
            onSelectEmdn={handleGmdnSelectEmdn}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <UsageTracker 
          onUpgradeNeeded={() => setShowPaymentModal(true)} 
          onEnterCode={() => setShowAccessCodeModal(true)}
        />
        <ViewSwitcher currentView={view} onViewChange={handleViewChange} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6">
          <div className="md:col-span-1 lg:col-span-1 h-[calc(100vh-180px)] flex flex-col">
            {renderLeftPanel()}
          </div>
          <div className="md:col-span-2 lg:col-span-3 h-[calc(100vh-180px)] overflow-y-auto bg-slate-800 rounded-lg shadow-lg p-6">
            {renderRightPanel()}
            
            {/* Feedback button */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
              title="Submit Feedback"
            >
              💬
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          // Refresh the page to update usage tracker
          window.location.reload();
        }}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        gmdnCode={feedbackContext.gmdnCode}
        emdnCode={feedbackContext.emdnCode}
        initialType={feedbackContext.type}
      />

      <AccessCodeModal
        isOpen={showAccessCodeModal}
        onClose={() => setShowAccessCodeModal(false)}
        onSuccess={() => {
          setShowAccessCodeModal(false);
          // Refresh the page to update usage tracker
          window.location.reload();
        }}
      />

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setShowTermsModal(false)}
      />

      <Footer onShowTerms={() => setShowTermsModal(true)} />
    </div>
  );
};

export default App;
