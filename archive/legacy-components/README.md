# Legacy Components Archive

This directory contains obsolete component files that have been replaced by enhanced versions.

## Archived Components

### EmdnDetail.tsx
- **Replaced by**: `components/EmdnDetailEnhanced.tsx`
- **Reason**: Basic version without category name display, external resources, and clinical indications
- **Archived**: October 2025

### GmdnDetail.tsx
- **Replaced by**: `components/GmdnDetailEnhanced.tsx`
- **Reason**: Basic version without GMDN↔EMDN mapping integration and premium features
- **Archived**: October 2025
- **Note**: Was only used by archived `App_clean.tsx`

## ICD Search Components (Not Archived - Feature Flagged)

The following ICD search components are NOT archived but are feature-flagged as disabled:
- `components/IcdSearch.tsx` - Basic ICD search
- `components/IcdSearchEnhanced.tsx` - Advanced ICD search with semantic relationships
- `components/IcdSearchFallback.tsx` - Fallback ICD search interface
- `components/IcdSearchSimple.tsx` - Simplified ICD search interface
- `components/IcdBrowser.tsx` - ICD browser interface
- `components/ICD11MMSSearch.tsx` - ICD-11 MMS search
- `components/IcfSearch.tsx` - ICF (International Classification of Functioning) search
- `components/IchiSearch.tsx` - ICHI (International Classification of Health Interventions) search

**Status**: Disabled via `config/features.ts` (`icdSearch: false`)

**To Enable**: Set `icdSearch: true` in `config/features.ts` and import into main App component

See `docs/FEATURE_MANAGEMENT.md` for more details.
