export interface CountryContact {
  email?: string[];
  website?: string[];
  phone?: string[];
}

export interface Country {
  id: string;
  name: string;
  region: string;
  primaryHTAAgencies?: string[];
  assessmentBody?: string;
  deviceAssessment?: string;
  codingRequirements: string[];
  approach?: string;
  contact?: CountryContact;
  recentChanges?: string[];
  system?: string[];
  structure?: string;
  process?: string[];
  collaboration?: string[];
  regionalVariation?: string;
  criticalDivergence?: string;
  criticalStatus?: string;
  mhraRequirements?: string;
  nhsProcurement?: string;
  timeline?: string;
  transition?: string;
  database?: string;
  updates?: string[];
  regionalAgencies?: string[];
  leadership?: string;
}

export interface EmdnCode {
  code: string;
  description: string;
  parentCode?: string;
  icdIndications?: IcdIndication[];
}

export interface SecondaryCode {
  code: string;
  description: string;
  relatedEmdnCodes: string[];
  icdIndications?: IcdIndication[];
}

export interface IcdIndication {
  code: string;
  indication: string;
  confidence: number;
  source: 'manual' | 'auto';
}

export interface IcdMapping {
  deviceCode: string;
  deviceTerm: string;
  deviceType: 'emdn' | 'gmdn';
  icdMatches: IcdIndication[];
}

export interface IcdLookupIndex {
  [deviceCode: string]: string[];
}

export interface EudamedCertificate {
  code: string;
  issuingBody: string;
  type: string;
  validFrom: string;
  expiryDate: string;
}

export interface EudamedDevice {
  udiDi: string;
  commercialName: string;
  manufacturerName: string;
  devicePublicViewUrl: string;
  certificates: EudamedCertificate[];
}
