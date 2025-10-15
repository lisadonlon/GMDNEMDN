# Archive Directory

This directory contains archived files, large source data, and legacy components that are not actively used but preserved for reference.

## Archived Application Files:

### `App_clean.tsx`
- **Original Purpose**: Simplified version of main App component
- **Reason for Archival**: Missing premium features (paywall, usage tracking, payment modals)
- **Replaced by**: Current `App.tsx` with full feature set
- **Archived**: October 2025

### `legacy-components/`
Contains superseded component files (EmdnDetail.tsx, GmdnDetail.tsx). See `legacy-components/README.md` for details.

## Large Source Data Files:

### device.txt (1.48GB)
- Source: FDA GUDID bulk data download
- Content: Complete device database from accessgudid.nlm.nih.gov
- Purpose: Used to extract GMDN codes (already processed)

### gmdnTerms.txt (2.8GB)  
- Source: FDA GUDID bulk data download
- Content: GMDN term definitions and mappings
- Purpose: Used to extract comprehensive GMDN database (already processed)

## Usage:

These files are only needed if you want to:
1. Re-extract GMDN data with updated source files
2. Validate data against original sources
3. Update the GMDN database with newer GUDID releases

## Data Processing:

Both files have been successfully processed into the application-ready formats:
- `data/gmdnFromGUDID.ts` (12,275 active GMDN codes)
- `emdn-chunks/` directory (8,453 EMDN codes in 23 category files)

## Updating Data:

To update with new GUDID releases:
1. Download latest bulk data from https://accessgudid.nlm.nih.gov/download
2. Replace files in this archive directory
3. Re-run `node data/extract-gmdn-stream.cjs archive/gmdnTerms.txt`