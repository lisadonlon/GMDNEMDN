# ICD-10 Integration Quick Setup Guide

## Overview

Your EMDN/GMDN Medical Device Navigator now includes ICD-10 clinical indication integration. This allows users to:

- View clinical indications for each EMDN and GMDN device code
- Search for devices by ICD-10 diagnosis codes
- Understand what medical conditions each device treats

## Setup Steps

### 1. Get WHO ICD API Credentials (Free)

1. Visit: https://icd.who.int/icdapi
2. Click "Register" and create an account
3. Once approved, go to the "API Access" section
4. Note your **Client ID** and **Client Secret**

### 2. Configure Credentials

Create a `.env` file in your project root:

```bash
ICD_CLIENT_ID=your_client_id_here
ICD_CLIENT_SECRET=your_client_secret_here
```

**Important:** Add `.env` to your `.gitignore` file to keep credentials secure.

### 3. Test API Connection

```bash
node icd-api.cjs test
```

Expected output:
```
✓ Authentication successful
✓ Found 3 results for "diabetes"
✓ All tests passed!
```

### 4. Generate Sample Mappings (Start Small)

Test with a small sample first:

```bash
# Test EMDN mappings (50 codes)
node map-emdn-to-icd10.cjs --sample=50

# Test GMDN mappings (50 codes)  
node map-gmdn-to-icd10.cjs --sample=50
```

This will create:
- `./icd10-mappings/emdn-icd10-mappings.json`
- `./icd10-mappings/gmdn-icd10-mappings.json`
- `./icd10-mappings/emdn-lookup-index.json`
- `./icd10-mappings/gmdn-lookup-index.json`

### 5. Copy Mappings to Public Directory

For the web app to access the mappings:

```bash
# Create public mapping directory
mkdir public/icd10-mappings

# Copy mapping files
copy icd10-mappings\*.json public\icd10-mappings\
```

### 6. Test in Web Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173

3. Try the new "Clinical Search" tab

4. Search for common ICD-10 codes like:
   - `E11` (Type 2 diabetes)
   - `I25.1` (Atherosclerotic heart disease)
   - `M16` (Hip osteoarthritis)

## Full Dataset Generation (Optional)

Once testing works, generate full mappings:

```bash
# Full EMDN dataset (8,453 codes) - takes ~30 minutes
node map-emdn-to-icd10.cjs

# Full GMDN dataset (12,275 codes) - takes ~1 hour
node map-gmdn-to-icd10.cjs
```

## What You'll See

### In Device Detail Pages
- **Clinical Indications** section showing ICD-10 codes
- Confidence ratings (Expert, High, Medium, Low)
- Links to WHO ICD-10 browser for more details
- Grouped by medical specialty

### In Clinical Search Tab
- Search by ICD-10 code or condition name
- Quick access buttons for common conditions
- Results showing both EMDN and GMDN devices
- Direct navigation to device details

## File Structure After Setup

```
your-project/
├── .env                           # API credentials (keep private!)
├── icd-api.cjs                     # WHO ICD API wrapper
├── map-emdn-to-icd10.cjs          # EMDN mapping generator
├── map-gmdn-to-icd10.cjs          # GMDN mapping generator
│
├── icd10-mappings/               # Generated mappings
│   ├── emdn-icd10-mappings.json
│   ├── gmdn-icd10-mappings.json
│   ├── emdn-high-confidence.json
│   ├── gmdn-high-confidence.json
│   ├── emdn-lookup-index.json
│   └── gmdn-lookup-index.json
│
├── public/icd10-mappings/        # Mappings for web app
│   └── (copy of above files)
│
└── data/icd10Utils.ts            # Integration utilities
```

## Expected Coverage

Based on pre-configured expert mappings and automatic discovery:

| Device Category | Expected Coverage |
|-----------------|-------------------|
| Cardiac devices | 80-90% |
| Diabetes devices | 85-95% |
| Orthopedic implants | 75-85% |
| Respiratory equipment | 70-80% |
| Dialysis equipment | 80-90% |
| Ophthalmology | 65-75% |

## Troubleshooting

### "Credentials not configured"
- Check `.env` file exists and has correct format
- Verify WHO ICD API account is approved
- Test: `node icd-api.cjs test`

### "No mappings created"
- Start with small sample: `--sample=10`
- Check API rate limits aren't exceeded
- Increase delay: edit `delayBetweenRequests` to 500ms

### "Clinical indications not available"
- Ensure mapping files are in `public/icd10-mappings/`
- Check browser developer console for fetch errors
- Verify web server is serving the public directory

### "API rate limit exceeded"
- Wait 1 minute and retry
- Increase delay between requests in mapping scripts
- Run mappings in smaller batches

## Next Steps

1. **Review Generated Mappings**: Check high-confidence mappings first
2. **Add Custom Mappings**: Edit the `MANUAL_MAPPINGS` sections for your priority devices
3. **Production Deployment**: Include `public/icd10-mappings/` in your deployment
4. **User Training**: Inform users about the new clinical search functionality

## Benefits for Your Users

- **Regulatory Teams**: Clinical evaluation reports, intended use documentation
- **Business Development**: Market sizing by disease prevalence
- **Clinical Affairs**: Risk classification justification
- **Sales Teams**: Clinical context for device positioning

## Integration with Other Standards

The ICD-10 integration complements your existing nomenclatures:

- **EMDN**: EU regulatory compliance
- **GMDN**: Global device classification  
- **ICD-10**: Clinical indication context
- **Country Data**: Regional HTA requirements

This provides a comprehensive view of medical devices from regulatory, technical, and clinical perspectives.

---

**Need Help?** Check the detailed documentation in `ICD10-INTEGRATION.md` or review the API documentation at https://icd.who.int/icdapi