import React, { useEffect, useRef, useState, useCallback } from 'react';
import { User } from '../types';
import { geocodeLocation, getCachedCoordinates } from '../services/geocodingService';

// Declare atlas as a global variable
declare const atlas: any;

interface MapViewProps {
  users: User[];
  currentUser: User | null;
  managementChain: User[];
  directReports: User[];
  selectedUser: User | null;
  shouldZoomToUser?: boolean;
  onUserSelect: (user: User, shouldZoom?: boolean) => void;
}

// Azure Maps key injected at build time via webpack DefinePlugin
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY || '';

const MapView: React.FC<MapViewProps> = ({
  users,
  currentUser,
  managementChain,
  directReports,
  selectedUser,
  shouldZoomToUser = false,
  onUserSelect
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [popup, setPopup] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<Map<string, [number, number]>>(new Map());
  const geocodingRef = useRef<Set<string>>(new Set()); // Track in-progress geocoding
  const lastUserCountRef = useRef<number>(0); // Track user count for auto-zoom
  const isUserSelectionRef = useRef<boolean>(false); // Track if zoom was from user selection
  const popupUserIdRef = useRef<string | null>(null); // Track which user's popup is open

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialize map
    const newMap = new atlas.Map(mapRef.current, {
      authOptions: {
        authType: 'subscriptionKey',
        subscriptionKey: AZURE_MAPS_KEY
      },
      center: [0, 30],
      zoom: 2,
      style: 'road',
      language: 'en-US'
    });

    newMap.events.add('ready', () => {
      // Add controls
      newMap.controls.add([
        new atlas.control.ZoomControl()
      ], {
        position: 'top-left'
      });

      // Create popup
      const newPopup = new atlas.Popup({
        closeButton: true,
        pixelOffset: [0, -40]
      });
      setPopup(newPopup);
      setMap(newMap);
    });

    return () => {
      if (newMap) {
        newMap.dispose();
      }
    };
  }, []);

  // Geocode users that don't have cached coordinates
  useEffect(() => {
    const geocodeUsers = async () => {
      const usersNeedingGeocode = users.filter(user => {
        if (!user.location?.city) return false;
        const cached = getCachedCoordinates(user.location);
        if (cached) return false;
        // Don't re-geocode if already in progress
        const key = `${user.location.street}-${user.location.city}-${user.location.state}-${user.location.postalCode}-${user.location.countryOrRegion}`;
        if (geocodingRef.current.has(key)) return false;
        return true;
      });

      if (usersNeedingGeocode.length === 0) return;

      // Mark as in-progress
      usersNeedingGeocode.forEach(user => {
        const key = `${user.location.street}-${user.location.city}-${user.location.state}-${user.location.postalCode}-${user.location.countryOrRegion}`;
        geocodingRef.current.add(key);
      });

      // Geocode in batches
      const newCoords = new Map(userCoordinates);
      let hasNewCoords = false;

      for (const user of usersNeedingGeocode) {
        const coords = await geocodeLocation(user.location);
        if (coords) {
          newCoords.set(user.id, coords);
          hasNewCoords = true;
        }
      }

      if (hasNewCoords) {
        setUserCoordinates(newCoords);
      }
    };

    geocodeUsers();
  }, [users]);

  // Add markers when map is ready and coordinates are available
  useEffect(() => {
    if (!map || !popup || users.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.markers.remove(marker);
    });
    markersRef.current = [];

    // Deduplicate users by ID
    const uniqueUsers = Array.from(
      new Map(users.map(user => [user.id, user])).values()
    );

    // Create a set of management chain IDs and direct report IDs for quick lookup
    const managerIds = new Set(managementChain.map(m => m.id));
    const directReportIds = new Set(directReports.map(r => r.id));

    // Add markers for each user
    uniqueUsers.forEach(user => {
      if (!user.location?.city) return;

      // Try cached coordinates first, then user-specific coordinates
      let coords = getCachedCoordinates(user.location);
      
      if (!coords) {
        coords = userCoordinates.get(user.id) || null;
      }
      
      if (!coords) return;

      // Determine marker type and color
      let borderColor = '#ffffff'; // Default: colleague
      let markerType = 'colleague';

      if (currentUser && user.id === currentUser.id) {
        borderColor = '#5B5FC7'; // Current user: purple
        markerType = 'current';
      } else if (managerIds.has(user.id)) {
        borderColor = '#FF9500'; // Manager: orange
        markerType = 'manager';
      } else if (directReportIds.has(user.id)) {
        borderColor = '#34C759'; // Direct report: green
        markerType = 'direct-report';
      }

      // Create custom HTML marker with photo
      const markerElement = createPhotoMarker(user, borderColor, markerType);
      
      const marker = new atlas.HtmlMarker({
        position: coords,
        htmlContent: markerElement,
        anchor: 'bottom'
      });

      // Add click event
      map.events.add('click', marker, () => {
        const popupContent = createPopupContent(user, markerType);
        popup.setOptions({
          position: coords,
          content: popupContent
        });
        popup.open(map);
        popupUserIdRef.current = user.id; // Track which user's popup is open
        // Don't call onUserSelect - clicking on map should not pan/center
      });

      map.markers.add(marker);
      markersRef.current.push(marker);
    });

    // Add jitter to markers at same location to prevent overlap
    addMarkerJitter();

    // Auto-zoom to fit all markers only when EXPANDING (user count increased)
    // Don't zoom when collapsing (user count decreased)
    const currentMarkerCount = markersRef.current.length;
    if (!isUserSelectionRef.current && currentMarkerCount > 0 && 
        currentMarkerCount > lastUserCountRef.current) {
      fitMapToMarkers();
    }
    lastUserCountRef.current = currentMarkerCount;
    isUserSelectionRef.current = false;

    // Close popup if the user whose popup is open is no longer visible
    if (popup && popupUserIdRef.current) {
      const isPopupUserVisible = users.some(u => u.id === popupUserIdRef.current);
      if (!isPopupUserVisible) {
        popup.close();
        popupUserIdRef.current = null;
      }
    }

  }, [map, popup, users, currentUser, managementChain, directReports, userCoordinates, selectedUser]);

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (!map || markersRef.current.length === 0) return;

    // Get all marker positions
    const positions = markersRef.current.map(marker => marker.getOptions().position);
    
    if (positions.length === 1) {
      // Single marker - just center on it with reasonable zoom
      map.setCamera({
        center: positions[0],
        zoom: 8,
        type: 'ease',
        duration: 500
      });
      return;
    }

    // Calculate bounding box
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    positions.forEach(pos => {
      minLng = Math.min(minLng, pos[0]);
      maxLng = Math.max(maxLng, pos[0]);
      minLat = Math.min(minLat, pos[1]);
      maxLat = Math.max(maxLat, pos[1]);
    });

    // Add padding to the bounds
    const lngPadding = (maxLng - minLng) * 0.1 || 0.5;
    const latPadding = (maxLat - minLat) * 0.1 || 0.5;

    // Create bounding box and fit map to it
    const bounds = [
      minLng - lngPadding, // west
      minLat - latPadding, // south
      maxLng + lngPadding, // east
      maxLat + latPadding  // north
    ];

    map.setCamera({
      bounds: bounds,
      padding: 50,
      type: 'ease',
      duration: 500
    });
  };

  // Zoom to selected user when they change
  useEffect(() => {
    if (!map || !selectedUser?.location) return;

    // Mark this as a user selection to prevent auto-zoom conflict
    isUserSelectionRef.current = true;

    // Determine marker type for popup
    const managerIds = new Set(managementChain.map(m => m.id));
    const directReportIds = new Set(directReports.map(r => r.id));
    let markerType = 'colleague';
    if (currentUser && selectedUser.id === currentUser.id) {
      markerType = 'current';
    } else if (managerIds.has(selectedUser.id)) {
      markerType = 'manager';
    } else if (directReportIds.has(selectedUser.id)) {
      markerType = 'direct-report';
    }

    const zoomToUser = async () => {
      // Try to get coordinates from cache first
      let coords = getCachedCoordinates(selectedUser.location);
      
      // If not in cache, try the userCoordinates map
      if (!coords) {
        coords = userCoordinates.get(selectedUser.id) || null;
      }
      
      // If still no coords, geocode the location
      if (!coords) {
        coords = await geocodeLocation(selectedUser.location);
      }
      
      if (coords) {
        if (shouldZoomToUser) {
          // Double click - zoom in to user's location
          map.setCamera({
            center: coords,
            zoom: 10,
            type: 'ease',
            duration: 1000
          });
        } else {
          // Single click - just center on user, keep current zoom
          map.setCamera({
            center: coords,
            type: 'ease',
            duration: 500
          });
        }

        // Open popup for the selected user
        if (popup) {
          const popupContent = createPopupContent(selectedUser, markerType);
          popup.setOptions({
            position: coords,
            content: popupContent
          });
          popup.open(map);
          popupUserIdRef.current = selectedUser.id; // Track which user's popup is open
        }
      }
    };

    zoomToUser();
  }, [map, popup, selectedUser, shouldZoomToUser, userCoordinates, currentUser, managementChain, directReports]);

  const addMarkerJitter = () => {
    const locationCount: Record<string, number> = {};
    const locationIndex: Record<string, number> = {};

    markersRef.current.forEach(marker => {
      const pos = marker.getOptions().position;
      const key = `${pos[0]},${pos[1]}`;
      locationCount[key] = (locationCount[key] || 0) + 1;
    });

    markersRef.current.forEach(marker => {
      const pos = marker.getOptions().position;
      const key = `${pos[0]},${pos[1]}`;
      
      if (locationCount[key] > 1) {
        locationIndex[key] = (locationIndex[key] || 0) + 1;
        const angle = (locationIndex[key] / locationCount[key]) * 2 * Math.PI;
        const radius = 0.008; // Jitter radius in degrees (~0.8km)
        
        const newLng = pos[0] + radius * Math.cos(angle);
        const newLat = pos[1] + radius * Math.sin(angle);
        
        marker.setOptions({
          position: [newLng, newLat]
        });
      }
    });
  };

  const createPhotoMarker = (user: User, borderColor: string, type: string): string => {
    const photo = user.photo || '';
    const initials = `${user.givenName?.[0] || ''}${user.surname?.[0] || ''}`;
    const size = type === 'current' ? 48 : 40;
    const borderWidth = type === 'current' ? 4 : 3;

    if (photo && photo.startsWith('data:image')) {
      return `
        <div class="map-marker ${type}" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${borderColor};
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          background: #1f1f1f;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${photo}" alt="${user.displayName}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "/>
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${borderColor};
        "></div>
      `;
    }

    // Fallback to initials
    return `
      <div class="map-marker ${type}" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.35}px;
      ">
        ${initials}
      </div>
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${borderColor};
      "></div>
    `;
  };

  const createPopupContent = (user: User, type: string): string => {
    const roleLabel = type === 'manager' ? '(Manager)' : 
                      type === 'direct-report' ? '(Direct Report)' : 
                      type === 'current' ? '(You)' : '';
    
    const photo = user.photo && user.photo.startsWith('data:image') 
      ? `<img src="${user.photo}" alt="${user.displayName}" class="popup-photo" />`
      : `<div class="popup-initials">${user.givenName?.[0] || ''}${user.surname?.[0] || ''}</div>`;

    // Build location string with city, state, country, postal code
    const locationParts = [
      user.location?.city,
      user.location?.state,
      user.location?.countryOrRegion
    ].filter(Boolean);
    const locationString = locationParts.join(', ') || 'Unknown';
    const postalCode = user.location?.postalCode ? ` ${user.location.postalCode}` : '';

    return `
      <div class="map-popup">
        <div class="popup-header">
          ${photo}
          <div class="popup-info">
            <div class="popup-name">${user.displayName} ${roleLabel}</div>
            <div class="popup-title">${user.jobTitle || 'No title'}</div>
          </div>
        </div>
        <div class="popup-details">
          <div class="popup-location">📍 ${locationString}${postalCode}</div>
          ${user.mail ? `<div class="popup-email">✉️ ${user.mail}</div>` : ''}
          ${user.businessPhones?.[0] ? `<div class="popup-phone">📞 ${user.businessPhones[0]}</div>` : ''}
        </div>
      </div>
    `;
  };

  return (
    <div className="map-view">
      <div ref={mapRef} className="azure-map" />
    </div>
  );
};

export default MapView;
