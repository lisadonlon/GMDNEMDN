# ICD-10 Integration - Quick Reference

## 🚀 Setup (5 Minutes)

```bash
# 1. Register for WHO ICD API (free)
# Visit: https://icd.who.int/icdapi
# Get your Client ID and Client Secret

# 2. Create .env file
cat > .env << EOF
ICD_CLIENT_ID=your_client_id
ICD_CLIENT_SECRET=your_client_secret
EOF

# 3. Test connection
node icd-api.js test

# 4. Create mappings (start with samples)
node map-emdn-to-icd10.js --sample=20
node map-gmdn-to-icd10.js --sample=20
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `icd-api.js` | WHO ICD API wrapper |
| `map-emdn-to-icd10.js` | EMDN → ICD-10 mapper |
| `map-gmdn-to-icd10.js` | GMDN → ICD-10 mapper |
| `emdn-icd10-mappings/` | Generated EMDN mappings |
| `gmdn-icd10-mappings/` | Generated GMDN mappings |

## 🔍 Quick Commands

```bash
# Search ICD-10
node icd-api.js search "diabetes"
node icd-api.js search "heart failure"

# Lookup specific code
node icd-api.js get E11
node icd-api.js get I25.1

# Map devices
node map-emdn-to-icd10.js                 # Full run
node map-emdn-to-icd10.js --sample=50     # Test first
node map-emdn-to-icd10.js --category=J    # Specific category

node map-gmdn-to-icd10.js                 # Full run
node map-gmdn-to-icd10.js --sample=50     # Test first
```

## 💻 Use in Application

### Simple Lookup

```javascript
// Load mappings
const emdnIcd = require('./emdn-icd10-mappings/lookup-index.json');

// Get ICD codes
const icdCodes = emdnIcd['J0201']; // Pacemakers
// Returns: ['I49.5', 'I44.2', 'I44.1', 'I45.9']
```

### Full Details

```javascript
const mappings = require('./emdn-icd10-mappings/emdn-icd10-mappings.json');

const device = mappings.mappings.find(m => m.emdnCode === 'J0201');

console.log(device.icdMatches);
// Returns:
// [
//   { code: 'I49.5', indication: 'Sick sinus syndrome', confidence: 100 },
//   { code: 'I44.2', indication: 'AV block, complete', confidence: 100 }
// ]
```

## 🗺️ Pre-configured Mappings

| Device | EMDN/GMDN | ICD-10 Codes |
|--------|-----------|--------------|
| **Pacemakers** | J0201 / 35177 | I49.5, I44.2 |
| **Defibrillators** | J0301 / 32811 | I47.2, I49.0 |
| **Coronary stents** | C0103 / 47582 | I25.1, I21.9 |
| **Insulin pumps** | B0309 / 40120 | E10, E11 |
| **Hip prostheses** | N0101 / 35350 | M16, S72.0 |
| **Knee prostheses** | N0201 / 35357 | M17 |
| **Ventilators** | F0201 / 38528 | J96.0, J96.1 |
| **Dialysis** | D0601 / 41093 | N18.5, N17 |
| **IOLs** | Q0301 / 35878 | H25, H26 |
| **Hearing aids** | Y2145 / - | H90 |

## 📊 ICD-10 Chapter Reference

| Code | Chapter | Common Conditions |
|------|---------|-------------------|
| **I** | Circulatory | Heart disease, stroke, hypertension |
| **E** | Endocrine | Diabetes, thyroid disorders |
| **M** | Musculoskeletal | Arthritis, fractures, joint disease |
| **J** | Respiratory | Asthma, COPD, respiratory failure |
| **N** | Genitourinary | Kidney disease, bladder disorders |
| **H** | Eye/Ear | Cataracts, glaucoma, hearing loss |
| **G** | Nervous | Parkinson's, epilepsy, neuropathy |
| **C** | Neoplasms | Cancer, tumours |

## 🎯 Confidence Scores

- **100%** = Manual mapping (expert curated) 📌
- **80-99%** = High confidence ⭐⭐
- **60-79%** = Medium confidence ⭐
- **50-59%** = Low confidence ⚠️

## ✏️ Add Custom Mappings

Edit `map-emdn-to-icd10.js` or `map-gmdn-to-icd10.js`:

```javascript
const MANUAL_MAPPINGS = {
  'YOUR_CODE': [
    { code: 'ICD_CODE', indication: 'Condition name', confidence: 95 },
  ],
};
```

Then re-run: `node map-emdn-to-icd10.js`

## 🔄 Workflow

```
1. Register API → 2. Configure → 3. Test → 4. Map (sample) → 5. Review → 6. Full run
```

## 📈 Expected Coverage

| Device Type | EMDN Cat | Coverage |
|-------------|----------|----------|
| Active implantable | J | 70-85% |
| Cardiovascular | C, E | 65-80% |
| Diabetes | B | 80-90% |
| Orthopaedics | N, P | 75-85% |
| Respiratory | F | 70-80% |
| Surgical instruments | K | 20-40% |

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Credentials error | Check `.env` file format |
| Rate limit | Increase delay to 500ms |
| No mappings | Lower confidence: `--confidence=0.4` |
| Token expired | Delete `.icd-token.json` |

## 💡 Use Cases

### Clinical Evaluation Reports
```javascript
// Show disease burden
"This pacemaker treats I49.5 (Sick sinus syndrome), 
affecting 1 in 600 people over 65 years"
```

### Risk Classification
```javascript
// Justify device class
if (icdCode.startsWith('I21')) { // MI
  deviceClass = 'III'; // Life-threatening condition
}
```

### Market Sizing
```javascript
// Estimate patient population
"E11 (Type 2 diabetes): 537M patients globally"
```

### Search by Condition
```javascript
// Find devices treating diabetes
const diabetesDevices = mappings.filter(m => 
  m.icdMatches.some(icd => icd.code.startsWith('E1'))
);
```

## 🔗 Quick Links

- **WHO ICD API:** https://icd.who.int/icdapi
- **ICD-10 Browser:** https://icd.who.int/browse10/2019/en
- **Full Guide:** See `ICD10-INTEGRATION.md`

## ⚡ One-Line Commands

```bash
# Quick test
node icd-api.js test && echo "✓ Working!"

# Count mappings
cat emdn-icd10-mappings/lookup-index.json | jq 'length'

# Export to CSV
node -e "..." > clinical-indications.csv

# View high-confidence only
cat emdn-icd10-mappings/high-confidence-mappings.json | jq '.mappings | length'
```

## 📋 Integration Checklist

- [ ] Registered for WHO ICD API
- [ ] Configured credentials in `.env`
- [ ] Tested API connection
- [ ] Ran sample mappings (50 codes)
- [ ] Reviewed results
- [ ] Ran full mappings
- [ ] Added custom mappings for key devices
- [ ] Integrated into web application

## 🌍 Why ICD-10 for Europe?

✅ Used across all EU countries  
✅ Required for clinical documentation  
✅ Links to DRG/HRG payment systems  
✅ Essential for regulatory submissions  
✅ Free WHO API access

vs HCPCS:
❌ US-only  
❌ Not used in Europe  
⚠️ Still useful for US market

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| API registration | 5 min |
| Setup & test | 5 min |
| Sample mapping (50 codes) | 2-3 min |
| Full EMDN mapping (~15,000) | 60-90 min |
| Full GMDN mapping (~20,000) | 90-120 min |
| Review & customize | Variable |

**Tip:** Always start with `--sample=50` to test before full run!

---

**Need more detail?** See full documentation in `ICD10-INTEGRATION.md`
