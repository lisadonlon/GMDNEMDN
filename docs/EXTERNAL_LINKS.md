# External Links Validation Report

This document tracks the status of external links used in the application and provides alternatives for any broken or outdated links.

## Recently Fixed Links

### German Links
- **Old**: `https://www.dimdi.de/static/de/klassifikationen/ops/` ❌ **BROKEN**
- **New**: `https://www.bfarm.de/DE/Kodiersysteme/Klassifikationen/OPS-ICHI/OPS/_node.html` ✅ **WORKING**
- **Reason**: DIMDI was integrated into BfArM (Bundesinstitut für Arzneimittel und Medizinprodukte)

## Validated Links (Working as of October 2025)

### HTA Agency Links
- **Germany G-BA**: `https://www.g-ba.de/english/` ✅
- **France HAS**: `https://www.has-sante.fr/` ✅
- **Netherlands ZIN**: `https://www.zorginstituutnederland.nl/` ✅
- **France CCAM**: `https://www.ameli.fr/accueil-de-la-ccam` ✅

### International Standards
- **WHO ICD-10**: `https://icd.who.int/browse10/2019/en` ✅
- **WHO ICD-11**: `https://id.who.int/icd/release/11/2024-01` ✅

## Links to Monitor

The following links should be periodically checked as they may change:

### Regional Health Authorities
- **Cyprus**: `https://www.moh.gov.cy/` - Government website, stable
- **Spain**: `https://www.sanidad.gob.es/` - Government website, stable  
- **Italy**: `https://www.salute.gov.it/` - Government website, stable

### Specialized Agencies
- **Austria HTA**: `https://hta.lbg.ac.at/` - Academic institution, may change
- **Luxembourg**: `https://cns.public.lu/` - Government website, stable
- **Liechtenstein**: `https://www.llv.li/` - Government website, stable

## Link Update Process

When a link is found to be broken:

1. **Identify the organization** - Find the current official website
2. **Update the link** - Modify in the appropriate file:
   - Country HTA agencies: `data/countryData.ts`
   - Reimbursement systems: `components/CountryDetail.tsx`
3. **Test the new link** - Verify it works
4. **Document the change** - Update this file

## Common Link Changes

### Government Reorganizations
- **Germany**: DIMDI → BfArM (2020)
- **EU**: Some EMA links may redirect to new structure

### Website Restructures
- Many government sites update their URL structures annually
- Academic institutions may change hosting

## Alternative Resources

If official links are unavailable, these alternatives may help:

### For Coding Systems
- **DIMDI Archive**: `https://web.archive.org/` (Wayback Machine)
- **WHO Classifications**: `https://www.who.int/standards/classifications`
- **SNOMED CT**: `https://www.snomed.org/`

### For HTA Information
- **EUnetHTA**: `https://www.eunethta.eu/`
- **INAHTA**: `https://www.inahta.org/`
- **ISPOR**: `https://www.ispor.org/`

## Automated Link Checking

Consider implementing automated link checking:

```javascript
// Example link checker
async function validateLink(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 10000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

## Last Updated
- **Date**: October 11, 2025
- **By**: GitHub Copilot
- **Status**: German OPS link fixed, other key links verified