import React, { useEffect, useRef, useState } from 'react';

interface IcdCode {
  id: string;
  title: string;
  definition?: string;
  chapter?: string;
  chapterTitle?: string;
}

interface IcdBrowserProps {
  onCodeSelect?: (code: IcdCode) => void;
  className?: string;
}

declare global {
  interface Window {
    icd11ect: {
      createECT: (
        element: HTMLElement,
        settings: {
          apiServerUrl?: string;
          autoBind?: boolean;
          popupMode?: boolean;
          searchMode?: boolean;
          chapterFilter?: string[];
          language?: string;
          flatResults?: boolean;
          releaseId?: string;
          callback?: (data: any) => void;
        }
      ) => void;
    };
  }
}

const IcdBrowser: React.FC<IcdBrowserProps> = ({ onCodeSelect, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCode, setSelectedCode] = useState<IcdCode | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds total
    
    // Check if the WHO ICD ECT script is loaded
    const checkECTAvailable = () => {
      console.log('Checking for ICD ECT availability, attempt:', retryCount + 1);
      
      if (window.icd11ect && containerRef.current) {
        console.log('ICD ECT found, initializing...');
        initializeECT();
        setIsLoaded(true);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkECTAvailable, 100);
      } else {
        console.error('ICD ECT failed to load after', maxRetries, 'attempts');
        // Fallback: show a simple search interface
        showFallbackInterface();
      }
    };

    const initializeECT = () => {
      if (!containerRef.current || !window.icd11ect) return;

      // Clear any existing content
      containerRef.current.innerHTML = '';

      try {
        console.log('Creating ICD ECT with settings...');
        window.icd11ect.createECT(containerRef.current, {
          apiServerUrl: 'https://id.who.int/icd/release/11/2024-01',
          autoBind: false,
          popupMode: false,
          searchMode: true,
          language: 'en',
          flatResults: true,
          releaseId: '2024-01',
          callback: (data: any) => {
            console.log('ICD ECT Callback received:', data);
            
            if (data && data.selectedEntities && data.selectedEntities.length > 0) {
              const entity = data.selectedEntities[0];
              const icdCode: IcdCode = {
                id: entity.code || entity.theCode || 'Unknown',
                title: entity.title || entity.name || 'Unknown Title',
                definition: entity.definition || '',
                chapter: entity.chapter || '',
                chapterTitle: entity.chapterTitle || ''
              };
              
              console.log('ICD code selected:', icdCode);
              setSelectedCode(icdCode);
              if (onCodeSelect) {
                onCodeSelect(icdCode);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error initializing ICD ECT:', error);
        showFallbackInterface();
      }
    };

    const showFallbackInterface = () => {
      if (!containerRef.current) return;
      
      containerRef.current.innerHTML = `
        <div class="p-4 bg-slate-800 rounded-lg border border-slate-600">
          <h4 class="text-slate-200 font-medium mb-3">ICD Code Search</h4>
          <p class="text-slate-400 text-sm mb-4">The WHO ICD browser is not available. You can still search using common ICD codes:</p>
          <div class="space-y-2">
            <button onclick="window.selectIcdCode('I25.9', 'Chronic ischemic heart disease')" class="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm">I25.9 - Chronic ischemic heart disease</button>
            <button onclick="window.selectIcdCode('E11.9', 'Type 2 diabetes mellitus')" class="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm">E11.9 - Type 2 diabetes mellitus</button>
            <button onclick="window.selectIcdCode('J44.1', 'COPD with acute exacerbation')" class="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm">J44.1 - COPD with acute exacerbation</button>
            <button onclick="window.selectIcdCode('N18.9', 'Chronic kidney disease')" class="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm">N18.9 - Chronic kidney disease</button>
            <button onclick="window.selectIcdCode('S72.001A', 'Fracture of neck of femur')" class="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm">S72.001A - Fracture of neck of femur</button>
          </div>
        </div>
      `;
      
      // Set up global callback for fallback buttons
      (window as any).selectIcdCode = (code: string, title: string) => {
        const icdCode: IcdCode = {
          id: code,
          title: title,
          definition: `Selected ICD code: ${code}`,
          chapter: '',
          chapterTitle: ''
        };
        
        setSelectedCode(icdCode);
        if (onCodeSelect) {
          onCodeSelect(icdCode);
        }
      };
      
      setIsLoaded(true);
    };

    checkECTAvailable();
  }, [onCodeSelect]);

  return (
    <div className={`icd-browser-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          ICD-11 Classification Browser
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Search and browse the International Classification of Diseases to find relevant diagnostic codes.
        </p>
      </div>

      {!isLoaded && (
        <div className="flex items-center justify-center p-8 bg-slate-800 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-300">Loading ICD Classification Tool...</span>
        </div>
      )}

      <div 
        ref={containerRef}
        className="icd-ect-container bg-white rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {selectedCode && (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
          <h4 className="font-semibold text-slate-200 mb-2">Selected ICD Code</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-slate-300">Code: </span>
              <span className="text-sm text-blue-400 font-mono">{selectedCode.id}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-300">Title: </span>
              <span className="text-sm text-slate-200">{selectedCode.title}</span>
            </div>
            {selectedCode.definition && (
              <div>
                <span className="text-sm font-medium text-slate-300">Definition: </span>
                <span className="text-sm text-slate-200">{selectedCode.definition}</span>
              </div>
            )}
            {selectedCode.chapter && (
              <div>
                <span className="text-sm font-medium text-slate-300">Chapter: </span>
                <span className="text-sm text-slate-200">
                  {selectedCode.chapter} - {selectedCode.chapterTitle}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IcdBrowser;