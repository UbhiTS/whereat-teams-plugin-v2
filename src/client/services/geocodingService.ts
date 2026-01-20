// Azure Maps Geocoding Service with localStorage caching

import { Location } from '../types';

// Azure Maps key injected at build time via webpack DefinePlugin
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY || '';
const CACHE_KEY = 'geocode_cache';
const CACHE_VERSION = 'v2';

// In-memory cache for geocoded coordinates
let geocodeCache: Map<string, [number, number] | null> = new Map();

// Load cache from localStorage on init
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(`${CACHE_KEY}_${CACHE_VERSION}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      geocodeCache = new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.warn('Failed to load geocode cache from storage:', error);
  }
}

// Save cache to localStorage
function saveCacheToStorage(): void {
  try {
    const obj: Record<string, [number, number] | null> = {};
    geocodeCache.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(`${CACHE_KEY}_${CACHE_VERSION}`, JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to save geocode cache to storage:', error);
  }
}

// Initialize cache from localStorage
loadCacheFromStorage();

/**
 * Build a cache key from location data
 */
function buildCacheKey(location: Partial<Location>): string {
  const parts = [
    location.street,
    location.city,
    location.state,
    location.postalCode,
    location.countryOrRegion
  ].filter(Boolean).map(s => s!.toLowerCase().trim());
  return parts.join('|');
}

/**
 * Build a query string for the geocoding API using all available location data
 */
function buildGeocodeQuery(location: Partial<Location>): string {
  const parts: string[] = [];
  
  if (location.street) parts.push(location.street);
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (location.postalCode) parts.push(location.postalCode);
  if (location.countryOrRegion) parts.push(location.countryOrRegion);
  
  return parts.join(', ');
}

/**
 * Get country code from country name for API filtering
 */
function getCountryCode(country: string): string | null {
  const countryMap: Record<string, string> = {
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'united states of america': 'US',
    'canada': 'CA',
    'united kingdom': 'GB',
    'uk': 'GB',
    'germany': 'DE',
    'france': 'FR',
    'spain': 'ES',
    'italy': 'IT',
    'netherlands': 'NL',
    'australia': 'AU',
    'japan': 'JP',
    'china': 'CN',
    'india': 'IN',
    'singapore': 'SG',
    'ireland': 'IE',
    'sweden': 'SE',
    'switzerland': 'CH',
    'brazil': 'BR',
    'mexico': 'MX',
    'south korea': 'KR',
    'israel': 'IL',
    'uae': 'AE',
    'united arab emirates': 'AE',
  };
  
  const normalized = country.toLowerCase().trim();
  return countryMap[normalized] || null;
}

/**
 * Geocode a location to coordinates using Azure Maps Search API
 * Uses all available location fields for accuracy
 */
export async function geocodeLocation(location: Partial<Location>): Promise<[number, number] | null> {
  if (!location.city && !location.street && !location.postalCode) {
    return null;
  }

  const cacheKey = buildCacheKey(location);
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  try {
    const query = buildGeocodeQuery(location);
    
    // Use Azure Maps Search Address API with country filter for accuracy
    let url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${encodeURIComponent(query)}`;
    
    // Add country filter if available for better accuracy
    if (location.countryOrRegion) {
      const countryCode = getCountryCode(location.countryOrRegion);
      if (countryCode) {
        url += `&countrySet=${countryCode}`;
      }
    }
    
    console.log('Geocoding:', query);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      geocodeCache.set(cacheKey, null);
      saveCacheToStorage();
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Find the best match - prefer results that match the state/region
      let bestResult = data.results[0];
      
      if (location.state && data.results.length > 1) {
        const stateNormalized = location.state.toLowerCase();
        for (const result of data.results) {
          const resultState = (result.address?.countrySubdivision || '').toLowerCase();
          const resultStateName = (result.address?.countrySubdivisionName || '').toLowerCase();
          if (resultState === stateNormalized || resultStateName === stateNormalized ||
              resultState.includes(stateNormalized) || resultStateName.includes(stateNormalized) ||
              stateNormalized.includes(resultState) || stateNormalized.includes(resultStateName)) {
            bestResult = result;
            break;
          }
        }
      }
      
      const coords: [number, number] = [
        bestResult.position.lon,
        bestResult.position.lat
      ];
      
      console.log('Geocoded:', query, '->', coords);
      
      // Cache the result
      geocodeCache.set(cacheKey, coords);
      saveCacheToStorage();
      
      return coords;
    }
    
    // No results found
    console.warn('No geocoding results for:', query);
    geocodeCache.set(cacheKey, null);
    saveCacheToStorage();
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    geocodeCache.set(cacheKey, null);
    saveCacheToStorage();
    return null;
  }
}

/**
 * Get coordinates from cache only (synchronous)
 */
export function getCachedCoordinates(location: Partial<Location>): [number, number] | null {
  if (!location.city && !location.street && !location.postalCode) {
    return null;
  }
  
  const cacheKey = buildCacheKey(location);
  
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }
  
  return null;
}

/**
 * Clear the geocode cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  try {
    localStorage.removeItem(`${CACHE_KEY}_${CACHE_VERSION}`);
  } catch (error) {
    console.warn('Failed to clear geocode cache from storage:', error);
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: geocodeCache.size,
    entries: Array.from(geocodeCache.keys())
  };
}
