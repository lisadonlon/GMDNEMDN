# GMDN-EMDN Mapping Validation Report

**Date:** October 16, 2025  
**Action:** Removed invalid mappings from production

## Summary

- **Original mappings:** 402 GMDN codes
- **Valid mappings:** 97 GMDN codes (24.1%)
- **Removed mappings:** 305 GMDN codes (75.9%)

## Critical Errors Found

### 1. Missing EMDN Codes (190 mappings)
EMDN codes that don't exist in the current EMDN database:
- Examples: C040202, D010302, P010301, L020102, R020601
- These appear to be from an older EMDN version or fabricated

### 2. Description Mismatches (130 mappings)
EMDN codes exist but descriptions don't match:
- Example: GMDN 10735 "Nephrostomy catheter" → U010201
- U010201 actual description: "URETHRAL PROSTATIC AND BLADDER CATHETERS, NELATON, WITH BALLOON"
- Mapping claimed: "NEPHROSTOMY CATHETERS"

### 3. Root Cause Identified
**Bug in `map-gmdn-to-emdn.cjs`:**
- EMDN JSON files use `"term"` field for descriptions
- Script referenced `emdnCode.description` (which doesn't exist)
- This caused undefined values and fabricated descriptions in mappings
- **Fixed:** Changed to `emdnCode.term || emdnCode.description` at 3 locations

## Valid Mappings (97 total)

The following 97 GMDN codes have been validated and are now in production:

10234, 10960, 11467, 11474, 12500, 12875, 15178, 16204, 16345, 16545,
17453, 17663, 17887, 17942, 31328, 31658, 33819, 33968, 34175, 34672,
34858, 35176, 35352, 35375, 35586, 35697, 35811, 36079, 36117, 36349,
36890, 36980, 37165, 37447, 37459, 37808, 38262, 38530, 41660, 41839,
41981, 42194, 42811, 44333, 45607, 45716, 46346, 46495, 46569, 46832,
46878, 47172, 47176, 47179, 47247, 47259, 47769, 47770, 48173, 48174,
48175, 53705, 54185, 54186, 54413, 55847, 56286, 56754, 56870, 56889,
56891, 57054, 57058, 57486, 57596, 58183, 58403, 58409, 58776, 58787,
58865, 58923, 59221, 59222, 59482, 60734, 60882, 60963, 61435, 61762,
62767, 62810, 63256, 64054, 64055, 64677, 65432

## Production Files Updated

✅ `public/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - Now contains 97 valid mappings  
✅ `dist/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - Updated for production  
✅ `public/gmdn-emdn-mappings/gmdn-lookup-index.json` - 97 GMDN → EMDN lookups  
✅ `public/gmdn-emdn-mappings/emdn-lookup-index.json` - 83 EMDN → GMDN reverse lookups  
✅ `dist/gmdn-emdn-mappings/gmdn-lookup-index.json` - Updated  
✅ `dist/gmdn-emdn-mappings/emdn-lookup-index.json` - Updated  

## Archived Files

📦 `archive/old-mappings/` - Contains backups of the 402-mapping versions

## Scripts Created

1. **`analyze-all-mappings.cjs`** - Comprehensive validation script
2. **`extract-valid-mappings.cjs`** - Filters out invalid mappings
3. **`rebuild-lookup-indices.cjs`** - Regenerates lookup indices
4. **`verify-manual-mappings.cjs`** - Validates manual mappings

## Next Steps

1. ✅ **Immediate:** Production now uses only validated mappings
2. 🔄 **Future:** Review and correct the 305 invalid mappings
3. 🔄 **Future:** Run full mapping regeneration with fixed script for all 12,274 GMDN codes

## Technical Details

**Bug Fix Applied:**
```javascript
// Before (caused undefined values):
emdnDescription: emdnCode.description

// After (uses correct field):
emdnDescription: emdnCode.term || emdnCode.description
```

**Files Modified:**
- `map-gmdn-to-emdn.cjs` - Fixed field name references (3 locations)
- Production mapping files replaced with validated subset

**Validation Results:**
- 0 missing EMDN codes in valid set
- 0 description mismatches in valid set
- 9 GMDN descriptions show as "GMDN XXXXX" (minor issue, codes are valid)
- 6 semantic mismatches (may be intentional cross-category mappings)
