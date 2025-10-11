
import React from 'react';
import { Country, CountryContact } from '../types';
import { LinkIcon } from './icons/LinkIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';

interface CountryDetailProps {
  country: Country | null;
  onSelectEmdn: (code: string) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
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

const ContactInfo: React.FC<{ contact: CountryContact }> = ({ contact }) => (
    <div className="space-y-2">
        {contact.website?.map((site, i) => (
            <div key={`web-${i}`} className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-slate-400"/>
                <a href={site} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline break-all">{site}</a>
            </div>
        ))}
        {contact.email?.map((email, i) => (
            <div key={`email-${i}`} className="flex items-center space-x-2">
                <MailIcon className="w-4 h-4 text-slate-400"/>
                <a href={`mailto:${email}`} className="text-sky-400 hover:underline break-all">{email}</a>
            </div>
        ))}
        {contact.phone?.map((phone, i) => (
            <div key={`phone-${i}`} className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4 text-slate-400"/>
                <span className="text-slate-300">{phone}</span>
            </div>
        ))}
    </div>
);

const CountryDetail: React.FC<CountryDetailProps> = ({ country, onSelectEmdn }) => {
  if (!country) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Select a country to view details</p>
      </div>
    );
  }

  // Reimbursement systems information (descriptive only, no sample data)
  // Note: Links updated October 2025 - DIMDI was integrated into BfArM
  const reimbursementSystems: { [key: string]: { name: string, description: string, link?: string }[] } = {
    germany: [{ 
      name: 'OPS (German Procedure Classification)', 
      description: 'Operationen- und Prozedurenschlüssel - German surgical procedure codes',
      link: 'https://www.bfarm.de/DE/Kodiersysteme/Klassifikationen/OPS-ICHI/OPS/_node.html'
    }],
    france: [
      { 
        name: 'LPPR (List of Reimbursable Products)', 
        description: 'Liste des Produits et Prestations Remboursables',
        link: 'https://www.has-sante.fr/'
      },
      { 
        name: 'CCAM (Classification of Medical Acts)', 
        description: 'Classification Commune des Actes Médicaux',
        link: 'https://www.ameli.fr/accueil-de-la-ccam'
      },
    ],
    cyprus: [{ 
      name: 'ICD-10-CY (Cyprus GHS Classification)', 
      description: 'Cyprus General Healthcare System coding based on ICD-10',
      link: 'https://www.moh.gov.cy/'
    }],
    spain: [{ 
      name: 'CIE-10-ES (Spanish ICD-10)', 
      description: 'Clasificación Internacional de Enfermedades, 10ª Revisión',
      link: 'https://www.sanidad.gob.es/'
    }],
    italy: [{ 
      name: 'CND (Italian Medical Device Nomenclature)', 
      description: 'Classificazione Nazionale dei Dispositivi medici - basis for EMDN development',
      link: 'https://www.salute.gov.it/'
    }],
    netherlands: [{ 
      name: 'DBC (Diagnosis Treatment Combinations)', 
      description: 'Diagnose Behandeling Combinaties - Dutch healthcare coding',
      link: 'https://www.zorginstituutnederland.nl/'
    }],
  };

  const countryReimbursementData = reimbursementSystems[country.id];

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-4">{country.name}</h2>
      
      <DetailSection title="Primary HTA Agencies">
        {country.primaryHTAAgencies && <ul>{country.primaryHTAAgencies.map((agency, i) => <li key={i}>{agency}</li>)}</ul>}
      </DetailSection>

      <DetailSection title="Assessment / Device Bodies">
        {country.assessmentBody && <p><strong>Assessment Body:</strong> {country.assessmentBody}</p>}
        {country.deviceAssessment && <p><strong>Device Assessment:</strong> {country.deviceAssessment}</p>}
      </DetailSection>
      
      <DetailSection title="Coding Requirements">
        <ul>{country.codingRequirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
      </DetailSection>

      {countryReimbursementData && (
        <DetailSection title="Reimbursement & Procedure Codes">
          {countryReimbursementData.map(system => (
            <div key={system.name} className="mb-4 last:mb-0">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">{system.name}</h4>
              <div className="p-3 bg-slate-700/50 rounded-md">
                <p className="text-slate-300 text-sm mb-2">{system.description}</p>
                {system.link && (
                  <a 
                    href={system.link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Official Documentation
                  </a>
                )}
                <div className="mt-2 pt-2 border-t border-slate-600">
                  <p className="text-xs text-slate-400">
                    <strong>Integration Status:</strong> Future HCPCS API integration planned for billing code lookups
                  </p>
                </div>
              </div>
            </div>
          ))}
        </DetailSection>
      )}

      <DetailSection title="Approach & System">
        {country.approach && <p>{country.approach}</p>}
        {country.system && <ul>{country.system.map((sys, i) => <li key={i}>{sys}</li>)}</ul>}
        {country.structure && <p>{country.structure}</p>}
      </DetailSection>
      
      {Object.entries(country).map(([key, value]) => {
          if (!value || !['criticalDivergence', 'criticalStatus', 'mhraRequirements', 'nhsProcurement', 'timeline', 'transition', 'database', 'leadership', 'regionalVariation', 'collaboration'].includes(key)) return null;
          const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          return (
              <DetailSection key={key} title={title}>
                  <p>{value as string}</p>
              </DetailSection>
          )
      })}

      <DetailSection title="Process & Updates">
          {country.process && <ul>{country.process.map((p, i) => <li key={i}>{p}</li>)}</ul>}
          {country.updates && <ul>{country.updates.map((u, i) => <li key={i}>{u}</li>)}</ul>}
      </DetailSection>

      <DetailSection title="Recent Changes">
        {country.recentChanges && <ul>{country.recentChanges.map((change, i) => <li key={i}>{change}</li>)}</ul>}
      </DetailSection>
      
      <DetailSection title="Contact Information">
          {country.contact && <ContactInfo contact={country.contact} />}
      </DetailSection>
      
    </div>
  );
};

export default CountryDetail;