import { Location } from '../types';
/**
 * Geocode a location to coordinates using Azure Maps Search API
 * Uses all available location fields for accuracy
 */
export declare function geocodeLocation(location: Partial<Location>): Promise<[number, number] | null>;
/**
 * Get coordinates from cache only (synchronous)
 */
export declare function getCachedCoordinates(location: Partial<Location>): [number, number] | null;
/**
 * Clear the geocode cache
 */
export declare function clearGeocodeCache(): void;
/**
 * Get cache stats for debugging
 */
export declare function getCacheStats(): {
    size: number;
    entries: string[];
};
//# sourceMappingURL=geocodingService.d.ts.map