export interface Location {
  type: string;
  street: string | null;
  city: string;
  state: string;
  countryOrRegion: string;
  postalCode: string | null;
  officeLocation: string | null;
}

export interface DirectReport {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
  jobTitle: string;
}

export interface User {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  mail: string;
  jobTitle: string;
  officeLocation: string;
  businessPhones: string[];
  mobilePhone: string | null;
  preferredLanguage: string | null;
  location: Location;
  directReports: DirectReport[];
  directReportIds: string[];
  photo: string;
  scrapedAt: string;
}

export interface UserContext {
  currentUser: User | null;
  allUsers: User[];
  managementChain: User[];
  directReports: User[];
  selectedUser: User | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MapMarker {
  user: User;
  coordinates: [number, number];
  type: 'current' | 'manager' | 'direct-report' | 'colleague';
}

// City to coordinates mapping for geocoding
export const cityCoordinates: Record<string, [number, number]> = {
  // United States
  'mountain view': [-122.0838, 37.3861],
  'san francisco': [-122.4194, 37.7749],
  'seattle': [-122.3321, 47.6062],
  'redmond': [-122.1215, 47.6740],
  'new york': [-74.0060, 40.7128],
  'los angeles': [-118.2437, 34.0522],
  'chicago': [-87.6298, 41.8781],
  'austin': [-97.7431, 30.2672],
  'boston': [-71.0589, 42.3601],
  'denver': [-104.9903, 39.7392],
  'atlanta': [-84.3880, 33.7490],
  'dallas': [-96.7970, 32.7767],
  'irving': [-96.9489, 32.8140],
  'fort worth': [-97.3308, 32.7555],
  'miami': [-80.1918, 25.7617],
  'tampa': [-82.4572, 27.9506],
  'tarpon springs': [-82.7568, 28.1461],
  'orlando': [-81.3792, 28.5383],
  'phoenix': [-112.0740, 33.4484],
  'washington': [-77.0369, 38.9072],
  'glendale heights': [-88.0687, 41.9145],
  'glendale': [-118.2551, 34.1425],
  'naperville': [-88.1535, 41.7508],
  'schaumburg': [-88.0834, 42.0334],
  
  // Europe
  'london': [-0.1276, 51.5074],
  'paris': [2.3522, 48.8566],
  'berlin': [13.4050, 52.5200],
  'amsterdam': [4.9041, 52.3676],
  'dublin': [-6.2603, 53.3498],
  'munich': [11.5820, 48.1351],
  'zurich': [8.5417, 47.3769],
  'stockholm': [18.0686, 59.3293],
  'madrid': [-3.7038, 40.4168],
  'milan': [9.1900, 45.4642],
  
  // Asia Pacific
  'tokyo': [139.6917, 35.6895],
  'singapore': [103.8198, 1.3521],
  'sydney': [151.2093, -33.8688],
  'melbourne': [144.9631, -37.8136],
  'bangalore': [77.5946, 12.9716],
  'mumbai': [72.8777, 19.0760],
  'hyderabad': [78.4867, 17.3850],
  'delhi': [77.1025, 28.7041],
  'shanghai': [121.4737, 31.2304],
  'beijing': [116.4074, 39.9042],
  'hong kong': [114.1694, 22.3193],
  'seoul': [126.9780, 37.5665],
  'taipei': [121.5654, 25.0330],
  'jakarta': [106.8456, -6.2088],
  'kuala lumpur': [101.6869, 3.1390],
  
  // Canada
  'toronto': [-79.3832, 43.6532],
  'vancouver': [-123.1207, 49.2827],
  'montreal': [-73.5673, 45.5017],
  'ottawa': [-75.6972, 45.4215],
  
  // South America
  'sao paulo': [-46.6333, -23.5505],
  'buenos aires': [-58.3816, -34.6037],
  'mexico city': [-99.1332, 19.4326],
  
  // Middle East
  'dubai': [55.2708, 25.2048],
  'tel aviv': [34.7818, 32.0853],
  
  // Africa
  'johannesburg': [28.0473, -26.2041],
  'cape town': [18.4241, -33.9249],
  'cairo': [31.2357, 30.0444],
  'lagos': [3.3792, 6.5244],
  'nairobi': [36.8219, -1.2921],
};

export function getCityCoordinates(city: string): [number, number] | null {
  const normalizedCity = city.toLowerCase().trim();
  
  // Direct match
  if (cityCoordinates[normalizedCity]) {
    return cityCoordinates[normalizedCity];
  }
  
  // Partial match
  for (const [key, coords] of Object.entries(cityCoordinates)) {
    if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
      return coords;
    }
  }
  
  return null;
}
