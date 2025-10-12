const fs = require('fs');
const path = require('path');

// Batch 10 validated GMDN-EMDN mappings
const batch10Mappings = [
  {
    "gmdnCode": "57054",
    "gmdnDescription": "Coagulation factor VIII-associated antigen IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0103020207",
        "term": "COAGULATION FACTOR VIII",
        "category": "W",
        "similarity": 87.7
      }
    ]
  },
  {
    "gmdnCode": "62810",
    "gmdnDescription": "Retinol-binding protein IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102010306",
        "term": "RETINOL BINDING PROTEIN",
        "category": "W",
        "similarity": 92.6
      }
    ]
  },
  {
    "gmdnCode": "57058",
    "gmdnDescription": "Complement component C1q IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102010201",
        "term": "COMPLEMENT COMPONENT C1Q",
        "category": "W",
        "similarity": 93.7
      },
      {
        "code": "W0102010205",
        "term": "COMPLEMENT COMPONENT C4",
        "category": "W",
        "similarity": 87.6
      }
    ]
  },
  {
    "gmdnCode": "56891",
    "gmdnDescription": "Cancer antigen 125 (CA125) IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102030106",
        "term": "CANCER ANTIGEN 125",
        "category": "W",
        "similarity": 89.5
      }
    ]
  },
  {
    "gmdnCode": "56870",
    "gmdnDescription": "Calcitonin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102060301",
        "term": "CALCITONIN",
        "category": "W",
        "similarity": 88.3
      }
    ]
  },
  {
    "gmdnCode": "57299",
    "gmdnDescription": "Total human chorionic gonadotropin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102050205",
        "term": "TOTAL HUMAN CHORIONIC GONADOTROPIN",
        "category": "W",
        "similarity": 95.2
      }
    ]
  },
  {
    "gmdnCode": "57486",
    "gmdnDescription": "Neuron-specific enolase (NSE) IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102039007",
        "term": "NEURON SPECIFIC ENOLASE",
        "category": "W",
        "similarity": 91.1
      }
    ]
  },
  {
    "gmdnCode": "48174",
    "gmdnDescription": "Cystatin C IVD, calibrator",
    "emdnMatches": [
      {
        "code": "W0102019008",
        "term": "CYSTATIN C",
        "category": "W",
        "similarity": 87.1
      }
    ]
  },
  {
    "gmdnCode": "48175",
    "gmdnDescription": "Cystatin C IVD, control",
    "emdnMatches": [
      {
        "code": "W0102019008",
        "term": "CYSTATIN C",
        "category": "W",
        "similarity": 88.6
      }
    ]
  },
  {
    "gmdnCode": "48173",
    "gmdnDescription": "Cystatin C IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102019008",
        "term": "CYSTATIN C",
        "category": "W",
        "similarity": 88.3
      }
    ]
  },
  {
    "gmdnCode": "56754",
    "gmdnDescription": "Prostatic acid phosphatase (PAP) IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102030120",
        "term": "PROSTATIC ACID PHOSPHATASE (IC)",
        "category": "W",
        "similarity": 88.9
      }
    ]
  },
  {
    "gmdnCode": "62767",
    "gmdnDescription": "Alpha-1-antitrypsin (protease inhibitor) IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102019002",
        "term": "A1-ANTITRYPSIN (PROTEASE INHIBITOR)",
        "category": "W",
        "similarity": 89.7
      }
    ]
  },
  {
    "gmdnCode": "59482",
    "gmdnDescription": "Fragile X syndrome IVD, probe",
    "emdnMatches": [
      {
        "code": "W0106010104",
        "term": "FRAGILE X SYNDROME",
        "category": "W",
        "similarity": 93.4
      }
    ]
  },
  {
    "gmdnCode": "56889",
    "gmdnDescription": "Cancer antigen 19-9 (CA19-9) GI IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102030103",
        "term": "CANCER ANTIGEN 19-9",
        "category": "W",
        "similarity": 88.6
      }
    ]
  },
  {
    "gmdnCode": "57596",
    "gmdnDescription": "Somatostatin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102060508",
        "term": "SOMATOSTATIN",
        "category": "W",
        "similarity": 89.5
      }
    ]
  },
  {
    "gmdnCode": "57331",
    "gmdnDescription": "Insulin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102060104",
        "term": "INSULIN ANTIBODY",
        "category": "W",
        "similarity": 91.7
      }
    ]
  },
  {
    "gmdnCode": "40943",
    "gmdnDescription": "Radiology picture archiving and communication system workstation",
    "emdnMatches": [
      {
        "code": "Z110603",
        "term": "PICTURE ARCHIVING AND COMMUNICATION SYSTEMS",
        "category": "Z",
        "similarity": 91.6
      }
    ]
  },
  {
    "gmdnCode": "46265",
    "gmdnDescription": "Cardiac mapping system",
    "emdnMatches": [
      {
        "code": "Z12059002",
        "term": "CARDIAC MAPPING EQUIPMENT",
        "category": "Z",
        "similarity": 92.5
      }
    ]
  },
  {
    "gmdnCode": "58183",
    "gmdnDescription": "Electromagnetic surgical navigation device tracking system",
    "emdnMatches": [
      {
        "code": "Z12011401",
        "term": "SURGICAL NAVIGATION SYSTEM",
        "category": "Z",
        "similarity": 88.0
      }
    ]
  }
];

async function integrateBatch10Mappings() {
  try {
    const mappingsFile = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');
    
    // Read existing mappings
    let existingData = { metadata: {}, mappings: {} };
    if (fs.existsSync(mappingsFile)) {
      const content = fs.readFileSync(mappingsFile, 'utf8');
      existingData = JSON.parse(content);
    }
    
    console.log(`📋 Starting batch 10 integration...`);
    console.log(`📊 Found ${Object.keys(existingData.mappings).length} existing mappings`);
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // Process each mapping from batch 10
    for (const newMapping of batch10Mappings) {
      const gmdnCode = newMapping.gmdnCode;
      
      if (existingData.mappings[gmdnCode]) {
        // Update existing mapping
        existingData.mappings[gmdnCode] = {
          gmdnCode: newMapping.gmdnCode,
          gmdnDescription: newMapping.gmdnDescription,
          emdnMatches: newMapping.emdnMatches.map(match => ({
            emdnCode: match.code,
            emdnDescription: match.term,
            score: match.similarity,
            category: match.category
          }))
        };
        updatedCount++;
        console.log(`🔄 Updated GMDN ${newMapping.gmdnCode}: ${newMapping.gmdnDescription}`);
      } else {
        // Add new mapping
        existingData.mappings[gmdnCode] = {
          gmdnCode: newMapping.gmdnCode,
          gmdnDescription: newMapping.gmdnDescription,
          emdnMatches: newMapping.emdnMatches.map(match => ({
            emdnCode: match.code,
            emdnDescription: match.term,
            score: match.similarity,
            category: match.category
          }))
        };
        addedCount++;
        console.log(`✅ Added GMDN ${newMapping.gmdnCode}: ${newMapping.gmdnDescription}`);
      }
    }
    
    // Update metadata
    const totalMappings = Object.keys(existingData.mappings).length;
    existingData.metadata = {
      generated: new Date().toISOString(),
      version: "1.0.0",
      description: "GMDN to EMDN device code mappings",
      stats: {
        totalGmdn: totalMappings,
        mappedGmdn: totalMappings,
        manualMappings: totalMappings,
        automaticMappings: 0
      }
    };
    
    // Write updated mappings
    fs.writeFileSync(mappingsFile, JSON.stringify(existingData, null, 2));
    
    console.log(`\n📈 Batch 10 Integration Summary:`);
    console.log(`✅ Added: ${addedCount} new mappings`);
    console.log(`🔄 Updated: ${updatedCount} existing mappings`);
    console.log(`📊 Total mappings: ${totalMappings}`);
    
    // Analyze categories
    const categories = {};
    Object.values(existingData.mappings).forEach(mapping => {
      mapping.emdnMatches.forEach(match => {
        categories[match.category] = (categories[match.category] || 0) + 1;
      });
    });
    
    console.log(`\n📋 Category Distribution:`);
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} mappings`);
      });
    
  } catch (error) {
    console.error('❌ Error integrating batch 10 mappings:', error);
    process.exit(1);
  }
}

integrateBatch10Mappings();