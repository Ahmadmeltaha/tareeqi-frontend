import { useState, useEffect } from 'react';
import { rideAPI, universityAPI } from '../services/api';
import RideCard from '../components/RideCard';
import LocationAutocomplete from '../components/LocationAutocomplete';

const SearchRides = () => {
  const [rides, setRides] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    university_id: '',
    direction: '',
    departure_date: '',
    min_seats: '',
    max_price: '',
  });
  const [userLocation, setUserLocation] = useState({
    address: '',
    lat: null,
    lng: null,
  });
  const [maxDistanceKm, setMaxDistanceKm] = useState('3');

  useEffect(() => {
    fetchUniversities();
    searchRides();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await universityAPI.getAll();
      if (response.data.success) {
        setUniversities(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    }
  };

  const searchRides = async () => {
    setLoading(true);
    try {
      const params = {};

      // Add filter params
      if (filters.university_id) params.university_id = filters.university_id;
      if (filters.direction) params.direction = filters.direction;
      if (filters.departure_date) params.departure_date = filters.departure_date;
      if (filters.min_seats) params.min_seats = filters.min_seats;
      if (filters.max_price) params.max_price = filters.max_price;

      // Add location-based filtering
      if (userLocation.lat && userLocation.lng && maxDistanceKm) {
        params.user_lat = userLocation.lat;
        params.user_lng = userLocation.lng;
        params.max_distance_km = maxDistanceKm;
      }

      const response = await rideAPI.searchRides(params);
      setRides(response.data.data);
    } catch (error) {
      console.error('Failed to search rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleLocationSelect = (location) => {
    setUserLocation({
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchRides();
  };

  const clearFilters = () => {
    setFilters({
      university_id: '',
      direction: '',
      departure_date: '',
      min_seats: '',
      max_price: '',
    });
    setUserLocation({
      address: '',
      lat: null,
      lng: null,
    });
    setMaxDistanceKm('3');
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'to_university') return 'To University';
    if (direction === 'from_university') return 'From University';
    return direction;
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search Rides</h1>
        <p className="text-slate-400 mb-8">Find available rides to your destination</p>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* University and Direction Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">University</label>
                <select
                  name="university_id"
                  value={filters.university_id}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">All Universities</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} - {uni.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Direction</label>
                <select
                  name="direction"
                  value={filters.direction}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">All Directions</option>
                  <option value="to_university">To University</option>
                  <option value="from_university">From University</option>
                </select>
              </div>
            </div>

            {/* Your Location Filter - Optional */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <label className="block text-sm font-medium text-emerald-400 mb-3">
                Find rides near your location <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <LocationAutocomplete
                    label="Your Location (optional)"
                    value={userLocation.address}
                    onChange={(value) => setUserLocation(prev => ({ ...prev, address: value }))}
                    onPlaceSelect={handleLocationSelect}
                    placeholder="Enter your location to find nearby rides"
                    required={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Distance</label>
                  <select
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="1">1 km</option>
                    <option value="2">2 km</option>
                    <option value="3">3 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                  </select>
                </div>
              </div>
              {userLocation.lat && userLocation.lng && (
                <p className="text-xs text-emerald-400 mt-2">
                  Searching for rides within {maxDistanceKm}km of your location
                </p>
              )}
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  name="departure_date"
                  value={filters.departure_date}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Seats</label>
                <input
                  type="number"
                  name="min_seats"
                  placeholder="1"
                  min="1"
                  value={filters.min_seats}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Price (JOD)</label>
                <input
                  type="number"
                  name="max_price"
                  placeholder="5.00"
                  min="0"
                  step="0.25"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all duration-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Active Filters Display */}
        {(filters.university_id || filters.direction || userLocation.lat) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.university_id && (
              <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
                {universities.find(u => u.id.toString() === filters.university_id)?.name || 'University'}
              </span>
            )}
            {filters.direction && (
              <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
                {getDirectionLabel(filters.direction)}
              </span>
            )}
            {userLocation.lat && (
              <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
                Within {maxDistanceKm}km
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : rides.length > 0 ? (
          <>
            <p className="text-slate-400 mb-4">{rides.length} ride{rides.length !== 1 ? 's' : ''} found</p>
            <div className="grid gap-6">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} showUniversity />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-slate-400 text-lg mb-2">No rides found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchRides;
