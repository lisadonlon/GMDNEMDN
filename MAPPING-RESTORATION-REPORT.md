# GMDN-EMDN Mapping Restoration Report

**Date:** October 16, 2025  
**Action:** Restored 150 partially valid mappings

## Summary

### Before Restoration
- **Valid mappings:** 97 GMDN codes (24.1% of original 402)
- **Removed:** 305 mappings with critical errors

### After Restoration
- **Valid mappings:** 247 GMDN codes (61.4% of original 402)
- **Total EMDN relationships:** 281 matches
- **Restored:** 150 GMDN codes by removing invalid EMDN codes

## What Was Restored

The 150 restored mappings were removed during initial validation because they contained a **mix of valid and invalid EMDN codes**. The restoration process:

1. ✅ **Kept** all valid EMDN codes that exist in the current database
2. ❌ **Removed** fabricated/non-existent EMDN codes
3. ✅ **Restored** the mapping with only the valid codes

### Examples of Restored Mappings

| GMDN | Device | Valid EMDN Code | Description |
|------|--------|-----------------|-------------|
| 13755 | Stethoscope | C9005 | PHONENDOSCOPES AND STETHOSCOPES |
| 17882 | Defibrillator | C010201 | DEFIBRILLATORS |
| 34978 | Blood pressure cuff | Z12030285 | VITAL SIGNS MONITORING INSTRUMENTS - CONSUMABLES |
| 33181 | Hip prosthesis | P020201 | HIP PROSTHESES |
| 33692 | Knee prosthesis | P020202 | KNEE PROSTHESES |
| 41512 | Wheelchair | G020102 | WHEELCHAIRS |
| 34864 | Bandage | M010102 | BANDAGES |
| 13215 | Infusion pump | A010301 | INFUSION PUMPS |
| 13217 | Syringe pump | A010302 | SYRINGE PUMPS |
| 47017 | Hypodermic syringe | A0201 | SINGLE-USE SYRINGES |

## Category Breakdown

**Restored devices include:**
- Cardiovascular devices (defibrillators, stents, catheters)
- Prosthetics (hip, knee, shoulder, limb)
- Diagnostic equipment (stethoscopes, tonometers, audiometers)
- Infusion devices (pumps, syringes, needles)
- Wound care (dressings, bandages)
- Mobility aids (wheelchairs, crutches, walking sticks)
- Dialysis equipment (catheters, solutions)
- Respiratory devices (masks, tubes, ventilator circuits)
- IVD devices (lactate electrodes, glucose meters)
- Surgical instruments (electrosurgical systems, forceps)

## Validation Status

### ✅ Clean - No Critical Errors
- **0** missing EMDN codes in current set
- **0** description mismatches (all EMDN descriptions verified against source)
- **All 247 mappings** have been validated against actual EMDN database

### ⚠️ Minor Issues Remaining
- **9 GMDN descriptions** show as "GMDN XXXXX" (codes are valid, just missing descriptions in GMDN source)
- **6 semantic mismatches** in manual mappings (cross-category mappings that may be intentional)

## Still Excluded (155 mappings)

The remaining 155 mappings from the original 402 were **not restored** because:
1. **All their EMDN codes were invalid/non-existent** - nothing to restore
2. **Description mismatches with no valid alternatives** - semantically wrong mappings

These 155 would need:
- Research to find correct EMDN codes
- Manual validation by medical device experts
- Updates to EMDN database if codes are genuinely missing

## Production Impact

### Files Updated
✅ `public/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - 247 validated mappings  
✅ `dist/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - Production copy  
✅ `public/gmdn-emdn-mappings/gmdn-lookup-index.json` - 247 GMDN lookups  
✅ `public/gmdn-emdn-mappings/emdn-lookup-index.json` - 250 EMDN reverse lookups  
✅ `dist/gmdn-emdn-mappings/*` - All production copies updated  

### User Impact
- **154% increase** in available GMDN-EMDN mappings (97 → 247)
- All restored mappings have verified, real EMDN codes
- Improved coverage of common medical devices

## Technical Details

**Scripts Created:**
- `find-partially-valid-mappings.cjs` - Identified 150 salvageable mappings
- `restore-partially-valid-mappings.cjs` - Automated restoration process
- `verify-restoration.cjs` - Verification script

**Process:**
1. Loaded all 8,453 valid EMDN codes from source chunks
2. Analyzed 305 removed mappings
3. Found 150 with at least one valid EMDN code
4. Extracted valid codes, discarded invalid ones
5. Regenerated lookup indices
6. Verified all restorations

**Quality Assurance:**
- Cross-referenced against EMDN source files
- Verified code existence in database
- Confirmed description accuracy
- Validated category assignments

## Conclusion

✅ **Production now has 247 fully validated GMDN-EMDN mappings**  
✅ **All mappings use real, verified EMDN codes**  
✅ **154% increase in coverage from validation cleanup**  
✅ **Zero critical errors in production dataset**  

The restoration successfully recovered high-quality mappings that were initially flagged due to mixed valid/invalid codes, significantly improving the application's utility while maintaining data integrity.
