import { useState, useRef } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

// Predefined Jordan locations with coordinates
const JORDAN_LOCATIONS = [
  { name: 'Amman', lat: 31.9454, lng: 35.9284 },
  { name: 'Zarqa', lat: 32.0728, lng: 36.0880 },
  { name: 'Irbid', lat: 32.5556, lng: 35.8500 },
  { name: 'Salt', lat: 32.0392, lng: 35.7272 },
  { name: 'Madaba', lat: 31.7167, lng: 35.8000 },
  { name: 'Mafraq', lat: 32.3433, lng: 36.2081 },
  { name: 'Jerash', lat: 32.2746, lng: 35.8961 },
  { name: 'Ajloun', lat: 32.3325, lng: 35.7525 },
  { name: 'Karak', lat: 31.1853, lng: 35.7047 },
  { name: 'Aqaba', lat: 29.5267, lng: 35.0078 },
  { name: 'HTU (Al-Hashemite University)', lat: 32.0997, lng: 36.2044 },
  { name: 'University of Jordan', lat: 32.0181, lng: 35.8728 },
  { name: 'JUST', lat: 32.4950, lng: 35.9897 },
  { name: 'PSUT', lat: 31.9872, lng: 35.8281 },
  { name: 'GJU', lat: 32.0167, lng: 35.8667 },
  { name: 'Yarmouk University', lat: 32.5356, lng: 35.8500 },
  { name: 'Balqa Applied University', lat: 32.0392, lng: 35.7272 },
  { name: 'Hashemite University', lat: 32.0997, lng: 36.2044 },
];

const LocationAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  label,
  placeholder,
  required = true
}) => {
  const [autocomplete, setAutocomplete] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(JORDAN_LOCATIONS);
  const inputRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        // Use place.name if available (for universities, landmarks), otherwise use formatted_address
        const displayName = place.name || place.formatted_address;
        const location = {
          address: displayName,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        };
        onChange(displayName);
        if (onPlaceSelect) {
          onPlaceSelect(location);
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Filter locations for fallback dropdown
    const filtered = JORDAN_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredLocations(filtered);
    setShowDropdown(inputValue.length > 0 && filtered.length > 0);
  };

  const handleLocationSelect = (location) => {
    onChange(location.name);
    setShowDropdown(false);
    if (onPlaceSelect) {
      onPlaceSelect({
        address: location.name,
        lat: location.lat,
        lng: location.lng,
      });
    }
  };

  // Fallback UI when Google Maps is not available
  if (loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(filteredLocations.length > 0)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filteredLocations.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleLocationSelect(loc)}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-1">Select from Jordan locations</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
          <div className="text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: 'jo' }, // Restrict to Jordan
          fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
        />
      </Autocomplete>
    </div>
  );
};

export default LocationAutocomplete;
