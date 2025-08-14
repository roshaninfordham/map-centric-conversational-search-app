import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { LatLngBounds, LatLngTuple, Icon, divIcon } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { Location, PlaceResult } from '../types';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  center: Location;
  results: PlaceResult[];
  selectedResult: string | null;
  onResultSelect: (id: string | null) => void;
  onRecenterClick: () => void;
}

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false) => {
  return divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 ${color} rounded-full border-3 border-white shadow-lg flex items-center justify-center transform ${isSelected ? 'scale-125' : 'scale-100'} transition-all duration-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        ${isSelected ? '<div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>' : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const userLocationIcon = divIcon({
  html: `
    <div class="relative">
      <div class="w-6 h-6 bg-blue-600 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
      <div class="absolute inset-0 w-6 h-6 bg-blue-600 rounded-full opacity-30 animate-ping"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapController({ results, center }: { results: PlaceResult[]; center: Location }) {
  const map = useMap();

  useEffect(() => {
    if (results.length > 0) {
      const bounds = new LatLngBounds([]);
      
      // Add user location to bounds
      bounds.extend([center.latitude, center.longitude]);
      
      // Add all result locations to bounds
      results.forEach(result => {
        bounds.extend([result.position.latitude, result.position.longitude]);
      });
      
      // Fit the map to show all markers with padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [results, map, center]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  results,
  selectedResult,
  onResultSelect,
  onRecenterClick
}) => {
  const mapRef = useRef<any>(null);

  const getMarkerColor = (result: PlaceResult) => {
    switch (result.status) {
      case 'open':
        return 'bg-green-500';
      case 'closing_soon':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const centerPosition: LatLngTuple = [center.latitude, center.longitude];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={centerPosition}
        zoom={14}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController results={results} center={center} />
        
        {/* User location marker */}
        <Marker
          position={centerPosition}
          icon={userLocationIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="font-medium text-gray-900">Your Location</p>
              <p className="text-sm text-gray-600">Current position</p>
            </div>
          </Popup>
        </Marker>

        {/* Result markers */}
        {results.map((result) => (
          <Marker
            key={result.id}
            position={[result.position.latitude, result.position.longitude]}
            icon={createCustomIcon(getMarkerColor(result), selectedResult === result.id)}
            eventHandlers={{
              click: () => onResultSelect(selectedResult === result.id ? null : result.id),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-gray-900 mb-1">{result.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium">{result.rating}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : result.status === 'closing_soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status === 'open' ? 'Open' : result.status === 'closing_soon' ? 'Closing Soon' : 'Closed'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.address}</p>
                <p className="text-xs text-gray-500">{result.distance}m away</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Recenter button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRecenterClick}
        className="absolute top-4 right-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200"
      >
        <Navigation size={20} className="text-blue-600" />
      </motion.button>
    </div>
  );
};