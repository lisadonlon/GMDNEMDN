
import React from 'react';
import { EmdnCode, SecondaryCode, Country } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import EudamedSearch from './EudamedSearch';
import ClinicalIndications from './ClinicalIndications';

interface EmdnDetailProps {
  code: EmdnCode | null;
  allCodes: EmdnCode[];
  countryData: Country[];
  gmdnCodes: SecondaryCode[]; // Keep for interface compatibility but unused
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    // Helper to avoid rendering empty sections
    if (!children) return null;
    const childArray = React.Children.toArray(children);
    if (childArray.every(child => !child || (Array.isArray(child) && child.length === 0))) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-sky-400 mb-2 border-b border-slate-600 pb-2">{title}</h3>
            <div className="text-slate-300 space-y-2 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                {children}
            </div>
        </div>
    );
};

const EmdnDetail: React.FC<EmdnDetailProps> = ({ code, allCodes, countryData: _countryData, gmdnCodes: _gmdnCodes }) => {
  if (!code) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p>Select an EMDN code to view details</p>
      </div>
    );
  }

  // Build hierarchy breadcrumbs by following parent codes
  const breadcrumbs: EmdnCode[] = [];
  let currentCode: EmdnCode | undefined = code;
  
  while (currentCode) {
    breadcrumbs.unshift(currentCode);
    currentCode = currentCode.parentCode 
      ? allCodes.find(c => c.code === currentCode!.parentCode)
      : undefined;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-white font-mono">{code.code}</h2>
        <p className="text-slate-300 mt-1">{code.description}</p>
        <a href="https://health.ec.europa.eu/medical-devices-sector/new-regulations/eudamed-new-regulations/european-medical-device-nomenclature-emdn_en" target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline inline-flex items-center space-x-1 mt-2">
          <span>Learn more about EMDN</span>
          <ExternalLinkIcon className="w-3 h-3" />
        </a>
      </div>

      <DetailSection title="EMDN Hierarchy">
        <div className="flex items-center flex-wrap text-sm text-slate-400">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.code}>
              <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-white' : ''}>
                {crumb.description}
              </span>
              {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
            </React.Fragment>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Code Details">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-slate-500 uppercase font-bold">Category</dt>
            <dd className="mt-1">{breadcrumbs[0]?.code || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase font-bold">Group</dt>
            <dd className="mt-1">{breadcrumbs[1]?.code || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase font-bold">Type</dt>
            <dd className="mt-1">{breadcrumbs[2]?.code || 'N/A'}</dd>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Clinical Indications">
        <ClinicalIndications deviceCode={code.code} deviceType="emdn" />
      </DetailSection>
      
      <DetailSection title="External Resources">
        <p className="text-xs text-slate-400 mb-2">
          Search for devices using this EMDN code description on various international regulatory databases.
        </p>
        <ul className="list-none pl-0 space-y-2">
          <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">EUDAMED</span>
            <a 
              href={`https://ec.europa.eu/tools/eudamed/#/screen/search-device`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <span>Search Devices</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </li>
          <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">FDA GUDID (USA)</span>
            <a 
              href={`https://accessgudid.fda.gov/devices/search?query=${encodeURIComponent(code.description)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <span>Search Term</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </li>
          <li className="p-2 bg-slate-700/50 rounded-md flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">TGA ARTG (Australia)</span>
            <a 
              href={`https://www.tga.gov.au/resources/artg?search_api_views_fulltext=${encodeURIComponent(code.description)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <span>Search Term</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </li>
        </ul>
      </DetailSection>

      <DetailSection title="EUDAMED Device & Certificate Search">
        <EudamedSearch emdnCode={code} />
      </DetailSection>

    </div>
  );
};

export default EmdnDetail;