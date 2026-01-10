import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rideAPI, universityAPI } from '../services/api';
import LocationAutocomplete from '../components/LocationAutocomplete';
import RouteMap from '../components/RouteMap';

// Fuel rates in JOD per km (based on Jordan fuel prices ~1.08 JOD/L for Gasoline 95)
// Average car: ~9L/100km = 0.09 L/km
// Petrol: 1.08 × 0.09 = ~0.10 JOD/km
// Hybrid: ~40% fuel savings = ~0.06 JOD/km
// Electric: ~0.03 JOD/km (electricity cost)
const FUEL_RATES = {
  petrol: 0.10,
  hybrid: 0.06,
  electric: 0.03
};

const AC_MULTIPLIER = 1.10; // 10% extra for AC (increases fuel consumption)
const PEAK_HOUR_FEE_PER_KM = 0.05; // 0.05 JOD per km during peak hours (7-9 AM, 4-6 PM)

// Check if departure time is during peak traffic hours in Jordan
const isPeakHour = (departureTime) => {
  if (!departureTime) return false;
  const timePart = departureTime.split('T')[1];
  if (!timePart) return false;
  const hour = parseInt(timePart.split(':')[0], 10);
  const isMorningPeak = hour >= 7 && hour < 9;
  const isAfternoonPeak = hour >= 16 && hour < 18;
  return isMorningPeak || isAfternoonPeak;
};

const PostRide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    origin_lat: null,
    origin_lng: null,
    destination_lat: null,
    destination_lng: null,
    departure_time: '',
    available_seats: '',
    description: '',
    gender_preference: user?.gender === 'female' ? 'female_only' : 'male_only',
    fuel_type: 'petrol',
    ac_enabled: false,
    distance_km: '',
    direction: 'to_university',
    university_id: '',
  });
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await universityAPI.getAll();
      if (response.data.success) {
        setUniversities(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  };

  const calculatePrice = (distance, fuelType, seats, acEnabled, trafficInfo, departureTime) => {
    if (!distance || !seats || parseInt(seats) === 0) return { pricePerSeat: 0, totalCost: 0, breakdown: null };

    const rate = FUEL_RATES[fuelType] || FUEL_RATES.petrol;
    const baseCost = parseFloat(distance) * rate;

    // Calculate traffic multiplier based on duration vs distance ratio
    let trafficMultiplier = 1.0;
    let trafficLevel = 'No traffic data';

    if (trafficInfo && trafficInfo.duration && trafficInfo.duration_in_traffic) {
      const normalDuration = trafficInfo.duration; // seconds
      const trafficDuration = trafficInfo.duration_in_traffic; // seconds
      const delayRatio = trafficDuration / normalDuration;

      // Calculate traffic multiplier based on delay
      if (delayRatio < 1.15) {
        trafficMultiplier = 1.0;
        trafficLevel = 'Light traffic';
      } else if (delayRatio < 1.35) {
        trafficMultiplier = 1.15;
        trafficLevel = 'Moderate traffic';
      } else if (delayRatio < 1.6) {
        trafficMultiplier = 1.30;
        trafficLevel = 'Heavy traffic';
      } else {
        trafficMultiplier = 1.50;
        trafficLevel = 'Very heavy traffic';
      }
    }

    // Calculate peak hour fee (7-9 AM and 4-6 PM)
    const isPeak = isPeakHour(departureTime);
    const peakHourFee = isPeak ? parseFloat(distance) * PEAK_HOUR_FEE_PER_KM : 0;

    // Apply multipliers for AC and traffic
    const acMultiplier = acEnabled ? AC_MULTIPLIER : 1;
    const costWithAC = baseCost * acMultiplier;
    const costWithTraffic = costWithAC * trafficMultiplier;
    const totalCost = costWithTraffic + peakHourFee;

    const pricePerSeat = totalCost / parseInt(seats);

    return {
      pricePerSeat: Math.round(pricePerSeat * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown: {
        distance: parseFloat(distance),
        rate,
        fuelType,
        acEnabled,
        acMultiplier,
        trafficMultiplier,
        trafficLevel,
        baseCost: Math.round(baseCost * 100) / 100,
        costWithAC: Math.round(costWithAC * 100) / 100,
        trafficCost: Math.round((costWithAC * trafficMultiplier) - costWithAC, 2),
        isPeakHour: isPeak,
        peakHourFee: Math.round(peakHourFee * 100) / 100,
        seats: parseInt(seats)
      }
    };
  };

  const updatePriceCalculation = (newFormData, trafficInfo = trafficData) => {
    const result = calculatePrice(
      newFormData.distance_km,
      newFormData.fuel_type,
      newFormData.available_seats,
      newFormData.ac_enabled,
      trafficInfo,
      newFormData.departure_time
    );
    setPriceBreakdown(result.breakdown ? result : null);
    return result.pricePerSeat;
  };

  const calculateDistance = async (originLat, originLng, destLat, destLng, departureTime) => {
    if (!originLat || !originLng || !destLat || !destLng) return { distance: 0, trafficData: null };

    // Try to use Google Maps Distance Matrix API with traffic data
    if (window.google && window.google.maps) {
      try {
        const service = new window.google.maps.DistanceMatrixService();

        // Prepare request with traffic model
        const request = {
          origins: [{ lat: parseFloat(originLat), lng: parseFloat(originLng) }],
          destinations: [{ lat: parseFloat(destLat), lng: parseFloat(destLng) }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: departureTime ? new Date(departureTime) : new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS
          }
        };

        const result = await new Promise((resolve, reject) => {
          service.getDistanceMatrix(request, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
              resolve(response);
            } else {
              reject(new Error('Distance calculation failed'));
            }
          });
        });

        const element = result.rows[0].elements[0];
        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;

        // Extract traffic data
        const traffic = {
          duration: element.duration.value, // seconds without traffic
          duration_in_traffic: element.duration_in_traffic?.value || element.duration.value // seconds with traffic
        };

        setTrafficData(traffic);
        return {
          distance: Math.round(distanceInKm * 10) / 10,
          trafficData: traffic
        };
      } catch (error) {
        console.log('Google Maps Distance Matrix failed, using Haversine formula');
      }
    }

    // Fallback to Haversine formula if Google Maps is not available
    const R = 6371; // Earth's radius in km
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLon = (destLng - originLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      distance: Math.round(distance * 10) / 10,
      trafficData: null
    };
  };

  const handleOriginSelect = async (location) => {
    const newFormData = {
      ...formData,
      origin: location.address,
      origin_lat: location.lat,
      origin_lng: location.lng,
    };

    if (formData.destination_lat && formData.destination_lng) {
      const result = await calculateDistance(
        location.lat,
        location.lng,
        formData.destination_lat,
        formData.destination_lng,
        formData.departure_time
      );
      newFormData.distance_km = result.distance.toString();
    }

    setFormData(newFormData);
    updatePriceCalculation(newFormData);
  };

  const handleDestinationSelect = async (location) => {
    const newFormData = {
      ...formData,
      destination: location.address,
      destination_lat: location.lat,
      destination_lng: location.lng,
    };

    if (formData.origin_lat && formData.origin_lng) {
      const result = await calculateDistance(
        formData.origin_lat,
        formData.origin_lng,
        location.lat,
        location.lng,
        formData.departure_time
      );
      newFormData.distance_km = result.distance.toString();
    }

    setFormData(newFormData);
    updatePriceCalculation(newFormData);
  };

  const handleUniversityChange = async (e) => {
    const universityId = e.target.value;
    const university = universities.find(u => u.id.toString() === universityId);

    console.log('Selected university:', university);
    console.log('University coordinates:', university?.latitude, university?.longitude);

    let newFormData = { ...formData, university_id: universityId };

    if (university) {
      if (formData.direction === 'to_university') {
        newFormData = {
          ...newFormData,
          destination: university.name,
          destination_lat: parseFloat(university.latitude),
          destination_lng: parseFloat(university.longitude),
        };
        // Calculate distance if origin is set
        if (formData.origin_lat && formData.origin_lng) {
          const result = await calculateDistance(
            formData.origin_lat,
            formData.origin_lng,
            parseFloat(university.latitude),
            parseFloat(university.longitude),
            formData.departure_time
          );
          newFormData.distance_km = result.distance.toString();
        }
      } else if (formData.direction === 'from_university') {
        newFormData = {
          ...newFormData,
          origin: university.name,
          origin_lat: parseFloat(university.latitude),
          origin_lng: parseFloat(university.longitude),
        };
        // Calculate distance if destination is set
        if (formData.destination_lat && formData.destination_lng) {
          const result = await calculateDistance(
            parseFloat(university.latitude),
            parseFloat(university.longitude),
            formData.destination_lat,
            formData.destination_lng,
            formData.departure_time
          );
          newFormData.distance_km = result.distance.toString();
        }
      }
    }

    setFormData(newFormData);
    updatePriceCalculation(newFormData);
  };

  const handleDirectionChange = (direction) => {
    const university = universities.find(u => u.id.toString() === formData.university_id);

    let newFormData = {
      ...formData,
      direction,
      // Reset location fields when direction changes
      origin: '',
      origin_lat: null,
      origin_lng: null,
      destination: '',
      destination_lat: null,
      destination_lng: null,
      distance_km: '',
    };

    if (university) {
      if (direction === 'to_university') {
        newFormData = {
          ...newFormData,
          destination: university.name,
          destination_lat: parseFloat(university.latitude),
          destination_lng: parseFloat(university.longitude),
        };
      } else if (direction === 'from_university') {
        newFormData = {
          ...newFormData,
          origin: university.name,
          origin_lat: parseFloat(university.latitude),
          origin_lng: parseFloat(university.longitude),
        };
      }
    }

    setFormData(newFormData);
    setPriceBreakdown(null);
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);

    // Recalculate traffic data when departure time changes
    if (name === 'departure_time' && formData.origin_lat && formData.destination_lat) {
      const result = await calculateDistance(
        formData.origin_lat,
        formData.origin_lng,
        formData.destination_lat,
        formData.destination_lng,
        newValue
      );
      // Calculate price with the fresh traffic data returned from calculateDistance
      updatePriceCalculation(newFormData, result.trafficData);
    }

    // Auto-calculate price when relevant fields change (including departure_time for peak hour)
    if (['distance_km', 'fuel_type', 'available_seats', 'ac_enabled', 'departure_time'].includes(name)) {
      updatePriceCalculation(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!priceBreakdown || priceBreakdown.pricePerSeat === 0) {
      setError('Please fill in distance and seats to calculate the price');
      setLoading(false);
      return;
    }

    if (!formData.university_id) {
      setError('Please select a university');
      setLoading(false);
      return;
    }

    // Check if departure time is in the past
    if (formData.departure_time) {
      const departureDate = new Date(formData.departure_time);
      const now = new Date();
      if (departureDate < now) {
        setError('Departure time cannot be in the past. Please select a future date and time.');
        setLoading(false);
        return;
      }
    }

    try {
      const rideData = {
        ...formData,
        price_per_seat: priceBreakdown.pricePerSeat,
        university_id: parseInt(formData.university_id),
      };
      await rideAPI.createRide(rideData);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Post a Ride</h1>
        <p className="text-slate-400 mb-8">Share your commute and split the fuel cost with passengers</p>

        {/* Floating Toast Alert for Errors */}
        {error && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
            <div className="bg-red-900/95 border border-red-500 text-red-100 px-6 py-4 rounded-xl shadow-2xl shadow-red-900/50 flex items-center gap-3 max-w-md">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 space-y-6">
          {/* Direction Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Ride Direction</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleDirectionChange('to_university')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                  formData.direction === 'to_university'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                To University
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange('from_university')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                  formData.direction === 'from_university'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                From University
              </button>
            </div>
          </div>

          {/* University Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">University</label>
            <select
              value={formData.university_id}
              onChange={handleUniversityChange}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a university</option>
              {universities.map(uni => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} - {uni.city}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Location Inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            {formData.direction === 'to_university' ? (
              <>
                <LocationAutocomplete
                  label="Pickup Location"
                  value={formData.origin}
                  onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                  onPlaceSelect={handleOriginSelect}
                  placeholder="Enter your pickup location"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Destination (University)
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-4 py-3 cursor-not-allowed"
                    placeholder="Select a university above"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Pickup (University)
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-4 py-3 cursor-not-allowed"
                    placeholder="Select a university above"
                  />
                </div>
                <LocationAutocomplete
                  label="Destination"
                  value={formData.destination}
                  onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  onPlaceSelect={handleDestinationSelect}
                  placeholder="Enter your destination"
                  required
                />
              </>
            )}
          </div>

          {/* Map Preview */}
          {formData.origin_lat && formData.destination_lat && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Route Preview</label>
              {/* Debug info */}
              <p className="text-xs text-slate-500 mb-2">
                Origin: {formData.origin_lat}, {formData.origin_lng} | Dest: {formData.destination_lat}, {formData.destination_lng}
              </p>
              <RouteMap
                originLat={formData.origin_lat}
                originLng={formData.origin_lng}
                destLat={formData.destination_lat}
                destLng={formData.destination_lng}
              />
              {formData.distance_km && (
                <p className="text-sm text-emerald-400 mt-2">
                  Estimated distance: {formData.distance_km} km
                </p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                required
                value={formData.departure_time}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Available Seats</label>
              <input
                type="number"
                name="available_seats"
                required
                min="1"
                max="8"
                value={formData.available_seats}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                placeholder="3"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fuel Type</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="petrol">Petrol (0.10 JOD/km)</option>
                <option value="hybrid">Hybrid (0.06 JOD/km)</option>
                <option value="electric">Electric (0.03 JOD/km)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Distance (KM)
                {formData.distance_km && formData.origin_lat && formData.destination_lat && (
                  <span className="ml-2 text-emerald-400 text-sm">
                    Auto-calculated
                  </span>
                )}
              </label>
              <input
                type="number"
                name="distance_km"
                required
                min="1"
                step="0.1"
                value={formData.distance_km}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
                placeholder="Enter distance or select locations"
                readOnly={formData.origin_lat && formData.destination_lat}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gender Preference</label>
              <select
                name="gender_preference"
                value={formData.gender_preference}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="male_only">Male Only</option>
                <option value="female_only">Female Only</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="ac_enabled"
                  checked={formData.ac_enabled}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span className="ml-3 text-slate-300">
                  AC On
                  <span className="text-sm text-slate-500 ml-2">(+10% to price)</span>
                </span>
              </label>
            </div>
          </div>

          {/* Price Calculation Display */}
          {priceBreakdown && priceBreakdown.pricePerSeat > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Calculated Cost per Seat</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-white">{priceBreakdown.pricePerSeat} JOD</span>
                <span className="text-slate-400">per passenger</span>
              </div>
              <div className="border-t border-slate-700 pt-4 space-y-2 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="text-white">{priceBreakdown.breakdown.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Fuel rate ({priceBreakdown.breakdown.fuelType}):</span>
                  <span className="text-white">{priceBreakdown.breakdown.rate} JOD/km</span>
                </div>
                <div className="flex justify-between">
                  <span>Base cost ({priceBreakdown.breakdown.distance} x {priceBreakdown.breakdown.rate}):</span>
                  <span className="text-white">{priceBreakdown.breakdown.baseCost} JOD</span>
                </div>
                {priceBreakdown.breakdown.acEnabled && (
                  <div className="flex justify-between text-yellow-400">
                    <span>AC (+10%):</span>
                    <span>+{(priceBreakdown.breakdown.baseCost * 0.10).toFixed(2)} JOD</span>
                  </div>
                )}
                {priceBreakdown.breakdown.trafficMultiplier > 1 && (
                  <div className="flex justify-between text-orange-400">
                    <span>{priceBreakdown.breakdown.trafficLevel} (+{((priceBreakdown.breakdown.trafficMultiplier - 1) * 100).toFixed(0)}%):</span>
                    <span>+{priceBreakdown.breakdown.trafficCost.toFixed(2)} JOD</span>
                  </div>
                )}
                {priceBreakdown.breakdown.isPeakHour && (
                  <div className="flex justify-between text-red-400">
                    <span>Peak hour fee (7-9 AM / 4-6 PM):</span>
                    <span>+{priceBreakdown.breakdown.peakHourFee.toFixed(2)} JOD</span>
                  </div>
                )}
                {priceBreakdown.breakdown.trafficLevel === 'No traffic data' && !priceBreakdown.breakdown.isPeakHour && (
                  <div className="flex justify-between text-slate-500 text-sm">
                    <span>Traffic data:</span>
                    <span>Not available (set departure time)</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span>Total cost:</span>
                  <span className="text-white">{priceBreakdown.totalCost} JOD</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-400">
                  <span>/ {priceBreakdown.breakdown.seats} seats =</span>
                  <span>{priceBreakdown.pricePerSeat} JOD per seat</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                {priceBreakdown.breakdown.isPeakHour && (
                  <span className="text-red-400 block mb-1">Peak hour surcharge applied: 0.05 JOD/km for trips during 7-9 AM and 4-6 PM.</span>
                )}
                {trafficData ?
                  `Price adjusts automatically based on real-time traffic conditions. ${priceBreakdown.breakdown.trafficLevel} detected for your departure time.` :
                  'Set a departure time to get traffic-aware pricing based on Google Maps real-time data.'
                }
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
              placeholder="AC, comfortable ride, flexible pickup locations..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Post Ride'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostRide;
