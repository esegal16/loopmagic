/**
 * LoopNet Property Scraper
 * Uses ScrapingBee API to bypass anti-bot protection
 * Extracts structured JSON-LD data from LoopNet listings
 */

import { PropertyData, Address, Photo, Broker, ScrapingError } from '../types';

const SCRAPINGBEE_BASE_URL = 'https://app.scrapingbee.com/api/v1/';

// Helper to get API key (accessed at runtime, not import time)
function getScrapingBeeApiKey(): string {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    throw new ScrapingError('SCRAPINGBEE_API_KEY not found in environment variables');
  }
  return apiKey;
}

interface ScrapingBeeResponse {
  html: string;
  creditsUsed: number;
}

/**
 * Scrape a LoopNet property listing
 * @param loopnetUrl - Full LoopNet listing URL
 * @returns PropertyData object with all extracted information
 * @throws ScrapingError if scraping fails or URL is invalid
 */
export async function scrapeLoopNetProperty(loopnetUrl: string): Promise<PropertyData> {
  // Validate URL
  if (!loopnetUrl || !loopnetUrl.includes('loopnet.com/Listing/')) {
    throw new ScrapingError('Invalid LoopNet URL. Must be a property listing URL.', {
      url: loopnetUrl
    });
  }

  // Extract listing ID from URL
  const listingIdMatch = loopnetUrl.match(/\/Listing\/.*?\/(\d+)\//);
  const listingId = listingIdMatch ? listingIdMatch[1] : '';

  console.log(`🐝 Scraping LoopNet property: ${loopnetUrl}`);

  // Scrape with ScrapingBee
  const { html, creditsUsed } = await scrapeWithScrapingBee(loopnetUrl);

  console.log(`✅ Scraped successfully (${creditsUsed} credits)`);
  console.log(`📄 HTML size: ${Math.round(html.length / 1024)}KB`);

  // Extract JSON-LD structured data
  const jsonLDData = extractJSONLD(html);
  console.log(`📊 Found ${jsonLDData.length} JSON-LD blocks`);

  // Find the RealEstateListing object
  const listing = findRealEstateListing(jsonLDData);

  if (!listing) {
    throw new ScrapingError('Could not find property data in page. The listing may be inactive or unavailable.', {
      url: loopnetUrl,
      jsonLDBlocksFound: jsonLDData.length
    });
  }

  console.log(`✅ Found RealEstateListing data`);

  // Parse into PropertyData
  const propertyData = parsePropertyData(listing, loopnetUrl, listingId, html);

  console.log(`✅ Parsed property: ${propertyData.propertyName}`);
  console.log(`   Address: ${propertyData.address.fullAddress}`);
  console.log(`   Price: ${propertyData.priceFormatted}`);
  console.log(`   Type: ${propertyData.propertyType}`);
  console.log(`   Size: ${propertyData.buildingSizeFormatted}`);

  return propertyData;
}

const RETRYABLE_STATUS_CODES = new Set([520, 429, 503, 502, 504]);
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [0, 5000, 10000]; // immediate, 5s, 10s

/**
 * Scrape HTML using ScrapingBee API with automatic retries
 */
async function scrapeWithScrapingBee(url: string): Promise<ScrapingBeeResponse> {
  let lastError: Error | null = null;
  let totalCreditsUsed = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt] || 10000;
      console.log(`⏳ Retry ${attempt}/${MAX_RETRIES - 1} in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const result = await scrapeWithScrapingBeeOnce(url);
      if (totalCreditsUsed > 0) {
        console.log(`✅ Succeeded on attempt ${attempt + 1} (${totalCreditsUsed + result.creditsUsed} total credits)`);
      }
      return { html: result.html, creditsUsed: totalCreditsUsed + result.creditsUsed };
    } catch (error: any) {
      lastError = error;
      const status = error.details?.status;
      const creditsUsed = error.details?.creditsUsed || 0;
      totalCreditsUsed += creditsUsed;

      // Only retry on transient/retryable errors
      if (status && RETRYABLE_STATUS_CODES.has(status)) {
        console.warn(`⚠️  Attempt ${attempt + 1} failed with ${status} (${creditsUsed} credits). ${attempt < MAX_RETRIES - 1 ? 'Retrying...' : 'No more retries.'}`);
        continue;
      }

      // Non-retryable error — throw immediately
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new ScrapingError('All scraping attempts failed', { totalCreditsUsed });
}

/**
 * Single ScrapingBee API request (no retries)
 */
async function scrapeWithScrapingBeeOnce(url: string): Promise<ScrapingBeeResponse> {
  const apiKey = getScrapingBeeApiKey();

  const params = new URLSearchParams({
    api_key: apiKey,
    url: url,
    render_js: 'true',        // Required for LoopNet
    stealth_proxy: 'true',    // Bypass Akamai WAF
    block_resources: 'false', // Don't block any resources
    wait: '5000',             // Wait for content to load
    country_code: 'us',       // Use US proxies
  });

  const apiUrl = `${SCRAPINGBEE_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(apiUrl);

    const creditsUsed = parseInt(response.headers.get('spb-cost') || '0');
    const creditsRemaining = response.headers.get('spb-credits-remaining');

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: errorText };
      }

      throw new ScrapingError(
        `ScrapingBee API error: ${errorJson.reason || errorJson.error || 'Unknown error'}`,
        {
          status: response.status,
          error: errorJson,
          creditsUsed,
          creditsRemaining
        }
      );
    }

    const html = await response.text();

    // Check for access denied
    if (html.includes('Access Denied') || html.includes('access denied')) {
      throw new ScrapingError(
        'LoopNet blocked the request. The site may have updated its bot protection.',
        { creditsUsed }
      );
    }

    return { html, creditsUsed };
  } catch (error: any) {
    if (error instanceof ScrapingError) {
      throw error;
    }
    throw new ScrapingError(`Network error while scraping: ${error.message}`, {
      originalError: error.message
    });
  }
}

/**
 * Extract all JSON-LD blocks from HTML
 */
function extractJSONLD(html: string): any[] {
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      matches.push(json);
    } catch (e) {
      // Skip invalid JSON
      console.warn('⚠️  Found invalid JSON-LD block, skipping');
    }
  }

  return matches;
}

/**
 * Find the RealEstateListing object in JSON-LD data
 */
function findRealEstateListing(jsonLDData: any[]): any | null {
  for (const block of jsonLDData) {
    // Check if this block is a RealEstateListing
    if (block['@type']) {
      const types = Array.isArray(block['@type']) ? block['@type'] : [block['@type']];
      if (types.includes('RealEstateListing')) {
        return block;
      }
    }

    // Check if it's in @graph array
    if (block['@graph'] && Array.isArray(block['@graph'])) {
      const listing = block['@graph'].find((item: any) => {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        return types.includes('RealEstateListing');
      });
      if (listing) return listing;
    }
  }

  return null;
}

/**
 * Parse RealEstateListing JSON-LD into PropertyData
 */
function parsePropertyData(
  listing: any,
  url: string,
  listingId: string,
  html: string
): PropertyData {
  // Parse address
  const address = parseAddress(listing.contentLocation?.address);

  // Parse price
  const priceObj = listing.offers?.[0] || {};
  const price = priceObj.price || 0;
  const priceFormatted = formatCurrency(price);

  // Parse additional properties into a map
  const additionalProps = parseAdditionalProperties(listing.additionalProperty || []);

  // Extract photos
  const photos = extractPhotos(listing, html);

  // Extract brokers
  const brokers = parseBrokers(listing.provider || []);

  // Parse year built/renovated
  const yearBuiltRenovated = additionalProps['Year Built/Renovated'] || '';
  const yearMatch = yearBuiltRenovated.match(/(\d{4})/g);
  const yearBuilt = yearMatch ? parseInt(yearMatch[0]) : undefined;
  const yearRenovated = yearMatch && yearMatch.length > 1 ? parseInt(yearMatch[1]) : undefined;

  // Parse building size
  const buildingSizeStr = additionalProps['Building Size'] || '';
  const buildingSizeMatch = buildingSizeStr.match(/[\d,]+/);
  const buildingSize = buildingSizeMatch ? parseInt(buildingSizeMatch[0].replace(/,/g, '')) : 0;

  // Parse units
  const unitsStr = additionalProps['No. Units'] || '';
  const units = unitsStr ? parseInt(unitsStr) : undefined;

  // Parse occupancy
  const occupancyStr = additionalProps['Average Occupancy'] || '';

  // Parse walk score
  const walkScoreValue = additionalProps['Walk Score'];
  const walkScore = typeof walkScoreValue === 'number' ? walkScoreValue : undefined;

  // Parse amenities
  const amenitiesValue = additionalProps['Amenities'];
  const amenities = Array.isArray(amenitiesValue) ? amenitiesValue : undefined;

  // Parse price per unit
  const pricePerUnitStr = additionalProps['Price Per Unit'] || '';
  const pricePerUnitMatch = pricePerUnitStr.match(/[\d,]+/);
  const pricePerUnit = pricePerUnitMatch ? parseInt(pricePerUnitMatch[0].replace(/,/g, '')) : undefined;

  // Parse stories
  const storiesStr = additionalProps['No. Stories'] || '';
  const numberOfStories = storiesStr ? parseInt(storiesStr) : undefined;

  // Try to extract Cap Rate from HTML (not in JSON-LD)
  const capRate = extractCapRate(html);

  // Extract or calculate market rent
  const grossIncome = parseFloat(additionalProps['Annual Income']) || undefined;
  const marketRent = extractMarketRent(
    listing.description || '',
    grossIncome,
    undefined, // noi not typically available
    units
  );

  const propertyData: PropertyData = {
    // Core identification
    url,
    listingId,
    propertyName: listing.name || address.fullAddress,
    address,

    // Financial
    price,
    priceFormatted,
    pricePerUnit,
    pricePerSF: undefined, // Calculate if needed
    capRate,
    noi: undefined, // Not typically available in LoopNet data
    grossIncome,
    marketRent,

    // Property details
    propertyType: additionalProps['Property Type'] || 'Unknown',
    propertySubtype: additionalProps['Property Subtype'],
    buildingSize,
    buildingSizeFormatted: buildingSizeStr,
    lotSize: additionalProps['Lot Size'],
    units,

    // Building characteristics
    yearBuilt,
    yearRenovated,
    numberOfStories,
    buildingClass: additionalProps['Building Class'],
    occupancy: occupancyStr || undefined,
    zoning: additionalProps['Zoning'],

    // Amenities
    amenities,
    parkingRatio: additionalProps['Parking Ratio'],

    // Metrics
    walkScore,

    // Marketing
    description: listing.description || '',
    photos,

    // Brokers
    brokers,

    // Metadata
    dateModified: listing.dateModified,
    dateScraped: new Date().toISOString(),

    // Raw data for debugging
    rawJSON: listing,
  };

  return propertyData;
}

/**
 * Parse address from JSON-LD PostalAddress
 */
function parseAddress(addressObj: any): Address {
  if (!addressObj) {
    return {
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      fullAddress: 'Address not available',
      country: 'US'
    };
  }

  const fullAddress = [
    addressObj.streetAddress,
    addressObj.addressLocality,
    addressObj.addressRegion,
    addressObj.postalCode
  ].filter(Boolean).join(', ');

  return {
    streetAddress: addressObj.streetAddress || '',
    city: addressObj.addressLocality || '',
    state: addressObj.addressRegion || '',
    zipCode: addressObj.postalCode || '',
    fullAddress,
    country: addressObj.addressCountry || 'US'
  };
}

/**
 * Parse additionalProperty array into a key-value map
 */
function parseAdditionalProperties(props: any[]): Record<string, any> {
  const map: Record<string, any> = {};

  for (const prop of props) {
    if (prop.name && prop.value !== undefined) {
      // If value is an array with one item, extract it
      const value = Array.isArray(prop.value) && prop.value.length === 1
        ? prop.value[0]
        : prop.value;

      map[prop.name] = value;
    }
  }

  return map;
}

/**
 * Extract photos from listing data and HTML
 */
function extractPhotos(listing: any, html: string): Photo[] {
  const photos: Photo[] = [];

  // Add primary image from JSON-LD
  if (listing.image?.url) {
    photos.push({
      url: listing.image.url,
      width: listing.image.width,
      height: listing.image.height,
      caption: listing.image.caption || listing.name
    });
  }

  // Extract additional photos from HTML (look for LoopNet CDN URLs)
  const imageRegex = /https:\/\/images\d*\.loopnet\.com\/[^"'\s]+/g;
  const matches = html.match(imageRegex);

  if (matches) {
    // Deduplicate and filter
    const uniqueUrls = [...new Set(matches)]
      .filter(url => {
        // Filter out small/icon images
        return !url.includes('/106/') && !url.includes('/icon/');
      })
      .slice(0, 5); // Limit to 5 photos total

    for (const url of uniqueUrls) {
      // Don't add duplicate of primary image
      if (photos.find(p => p.url === url)) continue;

      photos.push({ url });

      // Stop at 5 photos
      if (photos.length >= 5) break;
    }
  }

  return photos;
}

/**
 * Parse broker information
 */
function parseBrokers(providers: any[]): Broker[] {
  if (!Array.isArray(providers)) return [];

  return providers
    .filter(p => p['@type'] === 'RealEstateAgent')
    .map(agent => ({
      name: agent.name || '',
      company: agent.memberOf?.name,
      photo: agent.image?.url,
      city: agent.address?.addressLocality,
      state: agent.address?.addressRegion
    }));
}

/**
 * Try to extract Cap Rate from HTML text
 */
function extractCapRate(html: string): string | undefined {
  // Remove HTML tags and look for cap rate pattern
  const text = html.replace(/<[^>]+>/g, ' ');
  const capRateMatch = text.match(/Cap Rate:?\s*(\d+\.?\d*%)/i);

  return capRateMatch ? capRateMatch[1] : undefined;
}

/**
 * Extract market rent from description or calculate from financials
 */
function extractMarketRent(
  description: string,
  grossIncome?: number,
  noi?: number,
  units?: number
): number | undefined {
  // Step 1: Try regex extraction from description
  const patterns = [
    /market\s+rent[s]?\s+(?:should\s+)?(?:average\s+)?\$?([\d,]+)/i,
    /rent[s]?\s+(?:at\s+)?\$?([\d,]+)\s+per\s+unit/i,
    /\$?([\d,]+)\s+per\s+unit\s+per\s+month/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 0 && value < 100000) { // Sanity check
        return value;
      }
    }
  }

  // Step 2: Calculate from financials
  if (grossIncome && units && units > 0) {
    return grossIncome / units / 12;
  }

  if (noi && units && units > 0) {
    // Estimate gross income from NOI (assume 60% NOI margin)
    const estimatedGrossIncome = noi / 0.6;
    return estimatedGrossIncome / units / 12;
  }

  return undefined; // No market rent available
}

/**
 * Format number as currency
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}
