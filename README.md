<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# European Medical Device Nomenclature Navigator

A comprehensive web application for navigating the European Medical Device Nomenclature (EMDN) with country-specific classification systems for medical device regulatory compliance.

## Features

- **EMDN Classification**: Browse and search the official European Medical Device Nomenclature
- **Country-Specific Navigation**: Explore medical device classifications for:
  - France (CCAM, LPPR)
  - Belgium
  - Netherlands
  - Germany (OPS)
  - Ireland
  - United Kingdom
  - And more...
- **Hierarchical Navigation**: Explore device categories and subcategories
- **Detailed Information**: Access comprehensive details for each classification code
- **Smart Search**: Find devices quickly with intelligent fuzzy search
- **Trial Access**: 10-minute free trial, then unlimited access for €2/year
- **Privacy-First**: No user accounts, no data collection - simple access code system

## Technology Stack

- **Frontend**: React 18, TypeScript 5.5, Vite 5.4
- **Styling**: TailwindCSS
- **Search**: Fuse.js (fuzzy search)
- **Payment**: Stripe integration
- **Hosting**: Vercel (serverless functions)

## Data Sources

- **EMDN**: Official European Medical Device Nomenclature (EU MDR/IVDR Regulation 2017/745 & 2017/746)
- **Country Data**: Country-specific medical device classification systems:
  - France: CCAM (Classification Commune des Actes Médicaux), LPPR (Liste des Produits et Prestations Remboursables)
  - Germany: OPS (Operationen- und Prozedurenschlüssel)
  - ICD-10: International Classification of Diseases
  - Other national HTA agency requirements

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx
│   ├── CountryList.tsx
│   ├── CountryDetail.tsx
│   ├── EmdnList.tsx
│   ├── EmdnDetailEnhanced.tsx
│   ├── PaymentModal.tsx
│   ├── AccessCodeModal.tsx
│   └── UsageTracker.tsx
├── data/
│   ├── countryData.ts
│   ├── emdnChunkedData.ts
│   └── ... (additional data files)
├── api/                # Stripe payment integration
└── archive/            # Archived legacy code
```

## Development

**Prerequisites:** 
- Node.js 18+ 
- npm or yarn

**Setup:**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Environment Variables:**
- See `.env.example` for required variables
- Stripe keys needed for payment functionality

## Deployment

- **Platform**: Vercel
- **Live URL**: [emdn-navigator.vercel.app](https://emdn-navigator.vercel.app)
- **CI/CD**: Automatic deployment from GitHub main branch
- **Functions**: Serverless API routes for payment processing

## Access & Pricing

- **Free Trial**: 10 minutes of full access to explore all features
- **Annual Access**: €2 one-time payment for 12 months unlimited access
- **Payment**: Secure Stripe checkout
- **Access Code**: Delivered immediately after payment via email
- **Privacy**: No user accounts required, no personal data stored

## Legal Notice

This application uses the European Medical Device Nomenclature (EMDN) which is provided for reference purposes. All data is sourced from publicly available regulatory databases.

**Important**: GMDN (Global Medical Device Nomenclature) functionality has been removed from the production application for licensing compliance. Historical GMDN-related code and data are preserved in the `/archive` folder for reference purposes only.

## License

MIT License - see LICENSE file for details

## Contact

**Developer**: Lisa Donlon  
**Email**: lisa@donlonlsc.com  
**Issues**: Please use GitHub Issues for bug reports and feature requests

---

*Last Updated: October 2025*
