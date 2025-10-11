/**
 * Feature Configuration
 * 
 * Controls which features are enabled in the application.
 * Set to false to hide features that are not ready for production.
 * Set to true to enable features during development/testing.
 */

export interface FeatureConfig {
  // ICD-10 Clinical Indications
  icdClinicalIndications: boolean;
  
  // ICD Search Components (standalone ICD browsing)
  icdSearch: boolean;
  
  // External resource links (may have limited relevance)
  externalResources: boolean;
  
  // Semantic relationship statistics
  semanticStats: boolean;
  
  // Advanced search features
  advancedSearch: boolean;
  
  // Debug information
  debugInfo: boolean;
}

export const featureConfig: FeatureConfig = {
  // Hide ICD clinical indications until data is more complete
  icdClinicalIndications: false,
  
  // Hide ICD search until it's integrated properly
  icdSearch: false,
  
  // Keep external resources but may add disclaimers
  externalResources: true,
  
  // Hide semantic stats for now (may be incomplete)
  semanticStats: false,
  
  // Keep basic search, hide advanced features
  advancedSearch: false,
  
  // Hide debug info in production
  debugInfo: false,
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureConfig): boolean => {
  return featureConfig[feature];
};

/**
 * Development mode - enables more features for testing
 */
export const enableDevelopmentFeatures = () => {
  featureConfig.icdClinicalIndications = true;
  featureConfig.icdSearch = true;
  featureConfig.semanticStats = true;
  featureConfig.advancedSearch = true;
  featureConfig.debugInfo = true;
};

/**
 * Production mode - only stable features enabled
 */
export const enableProductionFeatures = () => {
  featureConfig.icdClinicalIndications = false;
  featureConfig.icdSearch = false;
  featureConfig.semanticStats = false;
  featureConfig.advancedSearch = false;
  featureConfig.debugInfo = false;
  featureConfig.externalResources = true;
};