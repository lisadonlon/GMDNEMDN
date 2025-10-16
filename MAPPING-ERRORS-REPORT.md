# Manual GMDN→EMDN Mapping Errors Report

## Critical Errors Found

### 1. ❌ **GMDN 48060: Thoracic stent graft → C040202**
- **Current Mapping**: C040202
- **Mapped Description**: "THORACIC STENT GRAFTS"
- **Actual EMDN C040202**: "PERIPHERAL VASCULAR THERAPEUTIC GUIDEWIRES"
- **Problem**: Complete mismatch - guidewires are not stent grafts
- **Correct EMDN Code**: Should be in category **P** (Implantable Prosthetic and Osteosynthesis Devices)
  - Suggested: `P070102010201` - "DACRON VASCULAR PROSTHESES, MULTIFURCATED (AORTIC ARCH (ALSO COLLATERAL AND MULTIPLE) AND THORACIC-ABDOMINAL)"
  - Or: `P0701` family - "VASCULAR PROSTHESES"

### 2. ⚠️ **GMDN 46832: Laryngoscope blade cover → R9002, Z12021003**
- **Current Mapping**: 
  - R9002: "LARYNGOSCOPE BLADES, SINGLE-USE"
  - Z12021003: "LARYNGOSCOPES"
- **GMDN Description**: "Laryngoscope blade cover"
- **Problem**: A blade *cover* is not the same as the blade or the laryngoscope itself
- **Issue**: Semantic mismatch - covers/accessories may need different classification

### 3. ⚠️ **Missing GMDN Descriptions**
Multiple GMDN codes show as "GMDN XXXXX" instead of actual descriptions in the mapping file. This suggests either:
- Data loading issue
- Corruption during mapping generation
- Missing GMDN codes in source data

**Affected GMDN Codes**:
- 17887
- 35352
- 36349
- 37447
- 37459
- 41981
- 42811
- 58865

## Validation Summary

| Status | Count | Description |
|--------|-------|-------------|
| ❌ Critical Errors | 1 | Wrong EMDN code/description |
| ⚠️ Warnings | 13 | Semantic mismatches or missing data |
| ✅ Correct | 6 | Verified mappings |

## Recommendations

1. **Immediate Action Required**:
   - Fix GMDN 48060 mapping from C040202 to P-category vascular prosthesis code
   - Regenerate mapping files after correction

2. **Data Quality**:
   - Investigate why GMDN descriptions are showing as "GMDN XXXXX"
   - Verify GMDN data loading process
   - Consider re-running GMDN data extraction

3. **Review Process**:
   - All manual mappings should be reviewed against official EMDN nomenclature
   - Implement automated validation before accepting manual mappings
   - Create test suite for mapping accuracy

## Files Requiring Updates

1. `map-gmdn-to-emdn.cjs` - Manual mappings source
2. `public/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - Generated mappings
3. `dist/gmdn-emdn-mappings/gmdn-emdn-mappings.json` - Built mappings
4. `data/corrected-gmdn-emdn-mappings.psv` - PSV export
5. `public/gmdn-emdn-mappings/emdn-lookup-index.json` - Lookup index
6. `public/gmdn-emdn-mappings/gmdn-lookup-index.json` - Reverse lookup index

---

Generated: October 16, 2025
