#!/usr/bin/env node
/**
 * Generate sample ICD-10 mappings for testing while WHO API authentication is resolved
 */

const fs = require('fs');
const path = require('path');

// Sample ICD-10 data for common medical device categories
const sampleIcdData = [
  {
    id: 'Z51.11',
    title: 'Encounter for antineoplastic chemotherapy',
    definition: 'Patient encounter for administration of antineoplastic chemotherapy',
    chapter: '21',
    chapterTitle: 'Factors influencing health status and contact with health services'
  },
  {
    id: 'I25.9',
    title: 'Chronic ischemic heart disease, unspecified',
    definition: 'A form of heart disease caused by narrowing of the coronary arteries',
    chapter: '09',
    chapterTitle: 'Diseases of the circulatory system'
  },
  {
    id: 'E11.9',
    title: 'Type 2 diabetes mellitus without complications',
    definition: 'Diabetes mellitus due to insulin resistance with normal insulin secretion',
    chapter: '04',
    chapterTitle: 'Endocrine, nutritional and metabolic diseases'
  },
  {
    id: 'M79.3',
    title: 'Panniculitis, unspecified',
    definition: 'Inflammation of subcutaneous fatty tissue',
    chapter: '13',
    chapterTitle: 'Diseases of the musculoskeletal system and connective tissue'
  },
  {
    id: 'N18.9',
    title: 'Chronic kidney disease, unspecified',
    definition: 'Progressive loss of kidney function over time',
    chapter: '14',
    chapterTitle: 'Diseases of the genitourinary system'
  },
  {
    id: 'J44.1',
    title: 'Chronic obstructive pulmonary disease with acute exacerbation',
    definition: 'COPD with worsening of respiratory symptoms',
    chapter: '10',
    chapterTitle: 'Diseases of the respiratory system'
  },
  {
    id: 'G93.1',
    title: 'Anoxic brain damage, not elsewhere classified',
    definition: 'Brain damage due to lack of oxygen',
    chapter: '06',
    chapterTitle: 'Diseases of the nervous system'
  },
  {
    id: 'K92.2',
    title: 'Gastrointestinal hemorrhage, unspecified',
    definition: 'Bleeding in the digestive tract',
    chapter: '11',
    chapterTitle: 'Diseases of the digestive system'
  },
  {
    id: 'S72.001A',
    title: 'Fracture of unspecified part of neck of right femur, initial encounter',
    definition: 'Break in the upper part of the thigh bone',
    chapter: '19',
    chapterTitle: 'Injury, poisoning and certain other consequences of external causes'
  },
  {
    id: 'Z51.81',
    title: 'Encounter for therapeutic apheresis',
    definition: 'Medical procedure to remove specific components from blood',
    chapter: '21',
    chapterTitle: 'Factors influencing health status and contact with health services'
  }
];

// Generate sample EMDN to ICD-10 mappings
function generateEmdnMappings() {
  const emdnMappings = [
    {
      emdnCode: 'A0101',
      emdnTerm: 'Cardiac catheter',
      clinicalIndications: [
        { icdCode: 'I25.9', confidence: 'High', source: 'Expert' },
        { icdCode: 'Z51.81', confidence: 'Medium', source: 'Automated' }
      ]
    },
    {
      emdnCode: 'A0102',
      emdnTerm: 'Angioplasty balloon catheter',
      clinicalIndications: [
        { icdCode: 'I25.9', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      emdnCode: 'A0201',
      emdnTerm: 'Insulin injection system',
      clinicalIndications: [
        { icdCode: 'E11.9', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      emdnCode: 'A0301',
      emdnTerm: 'Orthopedic implant',
      clinicalIndications: [
        { icdCode: 'S72.001A', confidence: 'High', source: 'Expert' },
        { icdCode: 'M79.3', confidence: 'Medium', source: 'Automated' }
      ]
    },
    {
      emdnCode: 'A0401',
      emdnTerm: 'Respiratory therapy equipment',
      clinicalIndications: [
        { icdCode: 'J44.1', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      emdnCode: 'A0501',
      emdnTerm: 'Dialysis equipment',
      clinicalIndications: [
        { icdCode: 'N18.9', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      emdnCode: 'A0601',
      emdnTerm: 'Neurological monitoring device',
      clinicalIndications: [
        { icdCode: 'G93.1', confidence: 'High', source: 'Expert' }
      ]
    },
    {
      emdnCode: 'A0701',
      emdnTerm: 'Gastroenterology device',
      clinicalIndications: [
        { icdCode: 'K92.2', confidence: 'High', source: 'Expert' }
      ]
    }
  ];

  return emdnMappings;
}

// Generate sample GMDN to ICD-10 mappings
function generateGmdnMappings() {
  const gmdnMappings = [
    {
      gmdnCode: '12345',
      gmdnTerm: 'Coronary stent',
      clinicalIndications: [
        { icdCode: 'I25.9', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      gmdnCode: '12346',
      gmdnTerm: 'Blood glucose meter',
      clinicalIndications: [
        { icdCode: 'E11.9', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      gmdnCode: '12347',
      gmdnTerm: 'Hip prosthesis',
      clinicalIndications: [
        { icdCode: 'S72.001A', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      gmdnCode: '12348',
      gmdnTerm: 'Nebulizer',
      clinicalIndications: [
        { icdCode: 'J44.1', confidence: 'Expert', source: 'Expert' }
      ]
    },
    {
      gmdnCode: '12349',
      gmdnTerm: 'Hemodialysis machine',
      clinicalIndications: [
        { icdCode: 'N18.9', confidence: 'Expert', source: 'Expert' }
      ]
    }
  ];

  return gmdnMappings;
}

// Create the mappings directory
const mappingsDir = path.join('public', 'icd10-mappings');
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}
if (!fs.existsSync(mappingsDir)) {
  fs.mkdirSync(mappingsDir);
}

// Generate and save sample data
const emdnMappings = generateEmdnMappings();
const gmdnMappings = generateGmdnMappings();

// Create lookup index
const lookupIndex = {
  icdCodes: {},
  emdnCodes: {},
  gmdnCodes: {},
  generated: new Date().toISOString(),
  version: '1.0.0',
  source: 'Sample data for testing'
};

// Add ICD data to lookup
sampleIcdData.forEach(icd => {
  lookupIndex.icdCodes[icd.id] = icd;
});

// Add EMDN mappings to lookup
emdnMappings.forEach(mapping => {
  lookupIndex.emdnCodes[mapping.emdnCode] = mapping;
});

// Add GMDN mappings to lookup
gmdnMappings.forEach(mapping => {
  lookupIndex.gmdnCodes[mapping.gmdnCode] = mapping;
});

// Save files
fs.writeFileSync(
  path.join(mappingsDir, 'emdn-icd10-mappings.json'),
  JSON.stringify(emdnMappings, null, 2)
);

fs.writeFileSync(
  path.join(mappingsDir, 'gmdn-icd10-mappings.json'),
  JSON.stringify(gmdnMappings, null, 2)
);

fs.writeFileSync(
  path.join(mappingsDir, 'icd10-lookup-index.json'),
  JSON.stringify(lookupIndex, null, 2)
);

console.log('✓ Sample ICD-10 mappings generated successfully!');
console.log(`Files created in: ${mappingsDir}`);
console.log(`- emdn-icd10-mappings.json (${emdnMappings.length} mappings)`);
console.log(`- gmdn-icd10-mappings.json (${gmdnMappings.length} mappings)`);
console.log(`- icd10-lookup-index.json (${sampleIcdData.length} ICD codes)`);
console.log('\nYou can now test the Clinical Search functionality while WHO API access is resolved.');