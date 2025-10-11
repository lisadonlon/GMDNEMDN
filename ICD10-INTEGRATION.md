# ICD-10 Integration for EMDN & GMDN

## Overview

This integration links your EMDN and GMDN device codes with **WHO ICD-10 diagnosis codes** to show which clinical conditions each device treats. This provides crucial clinical context for regulatory documentation, market analysis, and user understanding.

## What This Provides

- **Clinical indication mapping**: What diseases/conditions does this device treat?
- **Patient population context**: Disease prevalence and burden
- **Regulatory support**: Clinical evaluation reports, intended use documentation
- **Risk classification justification**: Link device to disease severity
- **Universal applicability**: ICD-10 is used globally, especially across Europe

## Quick Start

### Step 1: Register for WHO ICD API (Free)

1. Visit: https://icd.who.int/icdapi
2. Click "Register" and create an account
3. Once approved, go to "API Access" section
4. Note your **Client ID** and **Client Secret**

### Step 2: Configure Credentials

Create a `.env` file in your project root:

```bash
ICD_CLIENT_ID=your_client_id_here
ICD_CLIENT_SECRET=your_client_secret_here
```

Or set environment variables:

```bash
export ICD_CLIENT_ID="your_client_id"
export ICD_CLIENT_SECRET="your_client_secret"
```

### Step 3: Test API Connection

```bash
node icd-api.js test
```

Expected output:
```
✓ Authentication successful
✓ Found 3 results for "diabetes"
✓ All tests passed!
```

### Step 4: Create Mappings

```bash
# Map EMDN codes to ICD-10
node map-emdn-to-icd10.js

# Map GMDN codes to ICD-10
node map-gmdn-to-icd10.js
```

**Note:** This takes time due to API rate limiting (~200ms between requests)

### Step 5: Test with Samples First

```bash
# Test with 50 codes first
node map-emdn-to-icd10.js --sample=50
node map-gmdn-to-icd10.js --sample=50
```

## File Structure

```
your-project/
├── .env                           # API credentials (add to .gitignore!)
├── icd-api.js                     # WHO ICD API wrapper
├── map-emdn-to-icd10.js          # EMDN → ICD-10 mapper
├── map-gmdn-to-icd10.js          # GMDN → ICD-10 mapper
│
├── emdn-icd10-mappings/          # Generated EMDN mappings
│   ├── emdn-icd10-mappings.json  # Complete mappings
│   ├── high-confidence-mappings.json  # High-quality (≥80%)
│   ├── category-J.json            # Per-category files
│   └── lookup-index.json          # Quick lookup
│
├── gmdn-icd10-mappings/          # Generated GMDN mappings
│   ├── gmdn-icd10-mappings.json  # Complete mappings
│   ├── high-confidence-mappings.json
│   └── lookup-index.json
│
└── icd-cache/                     # Cached API responses
    └── ...
```

## Using the API Wrapper

### Search for Conditions

```bash
# Command line
node icd-api.js search "diabetes"
node icd-api.js search "heart failure"

# In code
const icdApi = require('./icd-api.js');

const results = await icdApi.search('diabetes');
// Returns: [{ code: 'E10', title: 'Type 1 diabetes mellitus', ... }]
```

### Lookup Specific Code

```bash
# Command line
node icd-api.js get E11
node icd-api.js lookup I25.1

# In code
const entity = await icdApi.lookupByCode('E11');
// Returns full ICD-10 entity with definition, inclusions, exclusions
```

## Understanding the Mappings

### Mapping Structure

```json
{
  "emdnCode": "J0201",
  "emdnTerm": "CARDIAC PACEMAKERS",
  "icdMatches": [
    {
      "code": "I49.5",
      "indication": "Sick sinus syndrome",
      "confidence": 100,
      "source": "manual"
    },
    {
      "code": "I44.2",
      "indication": "Atrioventricular block, complete",
      "confidence": 100,
      "source": "manual"
    }
  ]
}
```

### Confidence Scores

- **100%** = Manual mapping (expert-curated) 📌
- **80-99%** = High confidence (strong match) ⭐⭐
- **60-79%** = Medium confidence ⭐
- **50-59%** = Low confidence (use with caution)

### Mapping Sources

- **manual**: Pre-configured expert mappings
- **auto**: Automatically discovered via keyword search

## Pre-configured Manual Mappings

### Cardiac Devices
- **Pacemakers** → I49.5 (Sick sinus syndrome), I44.2 (AV block)
- **Defibrillators** → I47.2 (Ventricular tachycardia), I49.0 (V-fib)
- **Coronary stents** → I25.1 (Atherosclerotic heart disease), I21.9 (MI)
- **Heart valves** → I35.0 (Aortic stenosis), I34.0 (Mitral insufficiency)

### Diabetes
- **Insulin pumps** → E10 (Type 1 diabetes), E11 (Type 2 diabetes)

### Orthopaedics
- **Hip prostheses** → M16 (Hip osteoarthritis), S72.0 (Femoral fracture)
- **Knee prostheses** → M17 (Knee osteoarthritis)

### Respiratory
- **Ventilators** → J96.0 (Acute respiratory failure), J96.1 (Chronic)

### Dialysis
- **Haemodialysis** → N18.5 (CKD stage 5), N17 (Acute kidney failure)

### Ophthalmology
- **Intraocular lenses** → H25 (Senile cataract), H26 (Other cataract)

### Hearing
- **Hearing aids** → H90 (Conductive/sensorineural hearing loss)

## Integration into Web Application

### Option 1: Simple Lookup

```javascript
// Load lookup index
const emdnIcd10 = require('./emdn-icd10-mappings/lookup-index.json');
const gmdnIcd10 = require('./gmdn-icd10-mappings/lookup-index.json');

// Get ICD-10 codes for device
const icdCodes = emdnIcd10['J0201']; // Pacemakers
// Returns: ['I49.5', 'I44.2', 'I44.1', 'I45.9']

// Display in UI
<div class="clinical-indications">
  <h3>Clinical Indications</h3>
  <ul>
    <li>I49.5 - Sick sinus syndrome</li>
    <li>I44.2 - Atrioventricular block, complete</li>
  </ul>
</div>
```

### Option 2: Full Details

```javascript
const mappings = require('./emdn-icd10-mappings/emdn-icd10-mappings.json');

function getDeviceIndications(emdnCode) {
  const mapping = mappings.mappings.find(m => m.emdnCode === emdnCode);
  
  if (!mapping) {
    return null;
  }
  
  return {
    device: mapping.emdnTerm,
    indications: mapping.icdMatches.map(icd => ({
      code: icd.code,
      condition: icd.indication,
      confidence: icd.confidence,
      isManual: icd.source === 'manual'
    }))
  };
}

// Usage
const indications = getDeviceIndications('J0201');
```

### Option 3: API Endpoint

```javascript
// Express.js example
const express = require('express');
const emdnMappings = require('./emdn-icd10-mappings/emdn-icd10-mappings.json');

app.get('/api/device/:code/indications', (req, res) => {
  const code = req.params.code;
  const mapping = emdnMappings.mappings.find(m => m.emdnCode === code);
  
  if (!mapping) {
    return res.status(404).json({ error: 'No indications found' });
  }
  
  res.json({
    deviceCode: mapping.emdnCode,
    deviceName: mapping.emdnTerm,
    clinicalIndications: mapping.icdMatches,
    metadata: {
      highConfidenceCount: mapping.icdMatches.filter(m => m.confidence >= 80).length
    }
  });
});
```

## Adding Custom Mappings

### For EMDN Devices

Edit `map-emdn-to-icd10.js`:

```javascript
const MANUAL_MAPPINGS = {
  'J0201': [ // Cardiac pacemakers
    { code: 'I49.5', indication: 'Sick sinus syndrome', confidence: 100 },
    { code: 'I44.2', indication: 'Atrioventricular block, complete', confidence: 100 },
  ],
  // Add your mappings here
  'YOUR_CODE': [
    { code: 'ICD_CODE', indication: 'Condition name', confidence: 95 },
  ],
};
```

### For GMDN Devices

Edit `map-gmdn-to-icd10.js`:

```javascript
const MANUAL_MAPPINGS = {
  '35177': [ // Pacemaker, cardiac
    { code: 'I49.5', indication: 'Sick sinus syndrome', confidence: 100 },
  ],
  // Add your mappings here
  'YOUR_GMDN_CODE': [
    { code: 'ICD_CODE', indication: 'Condition name', confidence: 95 },
  ],
};
```

Then re-run the mapping script.

## Use Cases

### 1. Clinical Evaluation Reports

```javascript
// Show disease burden for device indication
const device = getDevice('J0201'); // Pacemaker
const indications = getDeviceIndications('J0201');

// In your report:
// "This device treats I49.5 (Sick sinus syndrome), 
//  affecting approximately 1 in 600 individuals over 65 years"
```

### 2. Risk Classification

```javascript
// Justify device classification based on disease severity
function getDiseaseSeverity(icdCode) {
  const severeCodes = ['I21', 'I46', 'N17', 'J96.0']; // Life-threatening
  const chronicCodes = ['E10', 'E11', 'M16', 'M17']; // Chronic, non-life-threatening
  
  if (severeCodes.some(code => icdCode.startsWith(code))) {
    return 'severe'; // Class III device likely
  } else if (chronicCodes.some(code => icdCode.startsWith(code))) {
    return 'chronic'; // Class IIa/IIb likely
  }
  
  return 'other';
}
```

### 3. Market Sizing

```javascript
// Estimate patient population
// "Devices treating E11 (Type 2 diabetes): 537M patients globally"
// "Devices treating M16 (Hip OA): 10% of population >60 years"
```

### 4. Search & Filter

```javascript
// Allow users to find devices by condition
function findDevicesByCondition(icdCode) {
  return mappings.mappings.filter(m => 
    m.icdMatches.some(icd => icd.code === icdCode || icd.code.startsWith(icdCode))
  );
}

// Usage: Find all devices for diabetes
const diabetesDevices = findDevicesByCondition('E1'); // E10, E11, etc.
```

## Coverage Statistics

### Expected Coverage Rates

| Device Category | EMDN Category | Expected Coverage |
|-----------------|---------------|-------------------|
| Active implantable | J | 70-85% |
| Cardiovascular | C, E | 65-80% |
| Diabetes | B | 80-90% |
| Orthopaedic implants | N, P | 75-85% |
| Respiratory | F | 70-80% |
| Dialysis | D | 80-90% |
| Ophthalmology | Q | 65-75% |
| Hearing | Y2145 | 70-80% |

**Lower coverage:**
- Surgical instruments (K) - 20-40%
- Consumables (A, T) - 10-30%
- Generic supplies - 5-20%

## Improving Mappings

### 1. Review Auto-Generated Mappings

```bash
# Check mappings with medium confidence
cat emdn-icd10-mappings/emdn-icd10-mappings.json | \
  jq '.mappings[] | select(.icdMatches[0].confidence < 80 and .icdMatches[0].confidence >= 60)'
```

### 2. Research Clinical Literature

For your priority devices:
- Review clinical guidelines
- Check FDA 510(k) summaries
- Consult medical device databases
- Review clinical trial registries

### 3. Consult Clinical Experts

For high-risk devices (Class III):
- Involve clinical specialists
- Validate indications
- Document rationale

## Maintenance

### API Rate Limits

WHO ICD API limits:
- ~200-300 requests/minute
- Scripts include built-in rate limiting (200ms delays)
- Token caching to reduce requests

### Data Updates

ICD-10 updates:
- WHO releases updates annually
- Mapping scripts use ICD-10 2019 release
- To update: Change `release: '10/2019'` in config

### Re-running Mappings

```bash
# After adding manual mappings
node map-emdn-to-icd10.js

# Or for specific category only
node map-emdn-to-icd10.js --category=J
```

## Troubleshooting

### "credentials not configured"

1. Check `.env` file exists
2. Verify variable names: `ICD_CLIENT_ID` and `ICD_CLIENT_SECRET`
3. Test: `node icd-api.js test`

### "No mappings created"

- Increase delay: Edit `delayBetweenRequests` to 500ms
- Lower confidence: `--confidence=0.4`
- Test with sample: `--sample=10`

### "API rate limit exceeded"

- Wait 1 minute and retry
- Increase `delayBetweenRequests` to 500ms
- Run in smaller batches using `--sample`

### "Token expired"

- Delete `.icd-token.json`
- Script will automatically get new token

## Advanced Usage

### Search Specific ICD Chapters

```javascript
// ICD-10 chapters
const chapters = {
  'I': 'Circulatory system',
  'E': 'Endocrine, nutritional and metabolic',
  'M': 'Musculoskeletal system',
  'J': 'Respiratory system',
  'N': 'Genitourinary system',
  'H': 'Eye and adnexa / Ear',
  'G': 'Nervous system',
};

// Filter by chapter
function getDevicesByChapter(chapter) {
  return mappings.mappings.filter(m => 
    m.icdMatches.some(icd => icd.code.startsWith(chapter))
  );
}
```

### Export for Regulatory Submissions

```bash
# Generate CSV for clinical evaluation report
node -e "
const data = require('./emdn-icd10-mappings/high-confidence-mappings.json');
console.log('EMDN Code,Device Name,ICD-10 Code,Clinical Indication,Confidence');
data.mappings.forEach(m => {
  m.icdMatches.forEach(icd => {
    console.log(\`\${m.emdnCode},\${m.emdnTerm},\${icd.code},\${icd.indication},\${icd.confidence}%\`);
  });
});
" > clinical-indications.csv
```

## Regulatory Context

### EU MDR Applications

**Clinical Evaluation Reports:**
- Demonstrate device intended use
- Link to clinical data for specific conditions
- Show disease prevalence and severity

**Risk Classification:**
- Justify risk class based on condition severity
- Document patient population characteristics

### PMCF (Post-Market Clinical Follow-up)

- Track real-world use for specific indications
- Monitor safety for different patient populations
- Validate intended use claims

## Comparison: ICD-10 vs HCPCS

| Aspect | ICD-10 | HCPCS |
|--------|--------|-------|
| **Purpose** | Diagnosis/condition | Reimbursement |
| **Geography** | Global (Europe, US, etc.) | US only |
| **Cost** | Free (WHO API) | Free (CMS) |
| **Device Relevance** | Clinical indication | Payment pathway |
| **Use in Europe** | ✅ Primary diagnosis coding | ❌ Not used |
| **Regulatory Value** | ✅ High (clinical evidence) | ⚠️ US market only |

**Recommendation:** Use **both**:
- ICD-10 for clinical context (universal)
- HCPCS for US reimbursement

## Next Steps

1. ✓ Register for WHO ICD API
2. ✓ Configure credentials
3. ✓ Test API connection
4. ⬜ Run mapping scripts (start with samples)
5. ⬜ Review high-confidence mappings
6. ⬜ Add manual mappings for priority devices
7. ⬜ Integrate into web application
8. ⬜ Document for regulatory submissions

---

**Questions?** Check `icd-api.js` inline comments or review WHO ICD API docs at https://icd.who.int/icdapi
