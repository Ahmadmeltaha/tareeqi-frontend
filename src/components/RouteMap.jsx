import { useLoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

const libraries = ['places'];

const RouteMap = ({ originLat, originLng, destLat, destLng, className = '' }) => {
  const [directions, setDirections] = useState(null);
  const [mapError, setMapError] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    if (isLoaded && originLat && originLng && destLat && destLng && window.google) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
          destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
          } else {
            console.error('Directions request failed:', status);
            setMapError(true);
          }
        }
      );
    }
  }, [isLoaded, originLat, originLng, destLat, destLng]);

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.75rem',
  };

  const center = originLat && originLng
    ? { lat: parseFloat(originLat), lng: parseFloat(originLng) }
    : { lat: 31.9454, lng: 35.9284 }; // Default to Amman

  if (loadError || mapError) {
    return (
      <div className={`bg-slate-900/50 rounded-lg p-4 text-center ${className}`}>
        <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-slate-400 text-sm">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`bg-slate-900/50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-32 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={10}
        center={center}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }]
            }
          ]
        }}
      >
        {directions ? (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#10b981',
                strokeWeight: 4,
              },
              suppressMarkers: false,
            }}
          />
        ) : (
          <>
            {originLat && originLng && (
              <Marker
                position={{ lat: parseFloat(originLat), lng: parseFloat(originLng) }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            )}
            {destLat && destLng && (
              <Marker
                position={{ lat: parseFloat(destLat), lng: parseFloat(destLng) }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            )}
          </>
        )}
      </GoogleMap>
    </div>
  );
};

export default RouteMap;
