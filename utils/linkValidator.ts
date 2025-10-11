/**
 * Link Validation Utility
 * 
 * Simple utility to validate external links in the application.
 * Can be run manually or integrated into build/test processes.
 */

interface LinkCheck {
  url: string;
  status: 'working' | 'broken' | 'redirect' | 'timeout';
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
}

/**
 * Check if a single URL is accessible
 */
export async function checkLink(url: string, timeout: number = 10000): Promise<LinkCheck> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return {
        url,
        status: 'working',
        statusCode: response.status
      };
    } else if (response.status >= 300 && response.status < 400) {
      return {
        url,
        status: 'redirect',
        statusCode: response.status,
        redirectUrl: response.headers.get('location') || undefined
      };
    } else {
      return {
        url,
        status: 'broken',
        statusCode: response.status
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        url,
        status: 'timeout',
        error: 'Request timed out'
      };
    }
    
    return {
      url,
      status: 'broken',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract all URLs from country data
 */
export function extractUrlsFromCountryData(): string[] {
  // This would need to import and parse the actual country data
  // For now, return the known URLs that need checking
  return [
    'https://www.g-ba.de/english/',
    'https://www.has-sante.fr/',
    'https://www.zorginstituutnederland.nl/',
    'https://www.bfarm.de/DE/Kodiersysteme/Klassifikationen/OPS-ICHI/OPS/_node.html',
    'https://www.ameli.fr/accueil-de-la-ccam',
    'https://www.moh.gov.cy/',
    'https://www.sanidad.gob.es/',
    'https://www.salute.gov.it/',
    'https://hta.lbg.ac.at/',
    'https://cns.public.lu/',
    'https://www.llv.li/',
    'https://www.hiqa.ie/',
    'https://www.hse.ie/',
    'https://www.tlv.se/',
    'https://www.sbu.se/en/',
    'https://amgros.dk/',
    'https://palveluvalikoima.fi/en/',
    'https://www.ppshp.fi/FinCCHTA/',
    'https://www.dmp.no/',
    'https://www.ima.is/',
    'https://www.aemps.gob.es/',
    'https://medicinesauthority.gov.mt/',
    'https://www.aotm.gov.pl/',
    'https://sukl.gov.cz/',
    'https://www.jazmp.si/',
    'https://www.zzzs.si/'
  ];
}

/**
 * Check multiple URLs and return a report
 */
export async function validateAllLinks(): Promise<LinkCheck[]> {
  const urls = extractUrlsFromCountryData();
  const results: LinkCheck[] = [];
  
  console.log(`Checking ${urls.length} URLs...`);
  
  for (const url of urls) {
    console.log(`Checking: ${url}`);
    const result = await checkLink(url);
    results.push(result);
    
    // Add a small delay to be respectful to servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Generate a markdown report of link validation results
 */
export function generateLinkReport(results: LinkCheck[]): string {
  const working = results.filter(r => r.status === 'working');
  const broken = results.filter(r => r.status === 'broken');
  const redirects = results.filter(r => r.status === 'redirect');
  const timeouts = results.filter(r => r.status === 'timeout');
  
  let report = `# Link Validation Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `**Summary**:\n`;
  report += `- ✅ Working: ${working.length}\n`;
  report += `- ❌ Broken: ${broken.length}\n`;
  report += `- 🔄 Redirects: ${redirects.length}\n`;
  report += `- ⏱️ Timeouts: ${timeouts.length}\n\n`;
  
  if (working.length > 0) {
    report += `## ✅ Working Links\n\n`;
    working.forEach(link => {
      report += `- [${link.url}](${link.url}) (${link.statusCode})\n`;
    });
    report += `\n`;
  }
  
  if (redirects.length > 0) {
    report += `## 🔄 Redirects\n\n`;
    redirects.forEach(link => {
      report += `- [${link.url}](${link.url}) → ${link.redirectUrl} (${link.statusCode})\n`;
    });
    report += `\n`;
  }
  
  if (broken.length > 0) {
    report += `## ❌ Broken Links\n\n`;
    broken.forEach(link => {
      report += `- [${link.url}](${link.url}) - ${link.error || `Status ${link.statusCode}`}\n`;
    });
    report += `\n`;
  }
  
  if (timeouts.length > 0) {
    report += `## ⏱️ Timeouts\n\n`;
    timeouts.forEach(link => {
      report += `- [${link.url}](${link.url}) - ${link.error}\n`;
    });
    report += `\n`;
  }
  
  return report;
}

/**
 * Manual link validation function for browser console
 * Usage: Copy and paste this into browser console to run validation
 */
export async function runLinkValidation() {
  const results = await validateAllLinks();
  const report = generateLinkReport(results);
  console.log(report);
  return results;
}