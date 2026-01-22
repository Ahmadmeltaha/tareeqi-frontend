import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rideAPI, universityAPI } from '../services/api';
import LocationAutocomplete from '../components/LocationAutocomplete';
import RouteMap from '../components/RouteMap';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

// Fuel rates in JOD per km (matching PostRide.jsx)
const FUEL_RATES = {
  petrol: 0.10,
  hybrid: 0.06,
  electric: 0.03
};

const AC_MULTIPLIER = 1.10;
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

const EditRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    gender_preference: 'male_only',
    fuel_type: 'petrol',
    ac_enabled: false,
    distance_km: '',
    direction: '',
    university_id: '',
  });

  const [universities, setUniversities] = useState([]);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRide();
    fetchUniversities();
  }, [id]);

  const fetchRide = async () => {
    try {
      const response = await rideAPI.getRide(id);
      if (response.data.success) {
        const ride = response.data.data;

        // Check if user is the driver
        if (ride.driver_id !== user?.id) {
          navigate('/driver/my-rides');
          return;
        }

        // Format departure time for datetime-local input
        const departureTime = new Date(ride.departure_time);
        const formattedTime = departureTime.toISOString().slice(0, 16);

        setFormData({
          origin: ride.origin || '',
          destination: ride.destination || '',
          origin_lat: ride.origin_lat,
          origin_lng: ride.origin_lng,
          destination_lat: ride.destination_lat,
          destination_lng: ride.destination_lng,
          departure_time: formattedTime,
          available_seats: ride.available_seats?.toString() || '',
          description: ride.description || '',
          gender_preference: ride.gender_preference || 'male_only',
          fuel_type: ride.fuel_type || 'petrol',
          ac_enabled: ride.ac_enabled || false,
          distance_km: ride.distance_km?.toString() || '',
          direction: ride.direction || '',
          university_id: ride.university_id?.toString() || '',
        });

        // Calculate initial price
        if (ride.distance_km && ride.available_seats) {
          const result = calculatePrice(
            ride.distance_km,
            ride.fuel_type || 'petrol',
            ride.available_seats,
            ride.ac_enabled || false,
            null
          );
          setPriceBreakdown(result.breakdown ? result : null);
        }
      }
    } catch (err) {
      setError('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

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

    let trafficMultiplier = 1.0;
    let trafficLevel = 'No traffic data';

    if (trafficInfo && trafficInfo.duration && trafficInfo.duration_in_traffic) {
      const normalDuration = trafficInfo.duration;
      const trafficDuration = trafficInfo.duration_in_traffic;
      const delayRatio = trafficDuration / normalDuration;

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

  // Calculate distance using Google Maps Distance Matrix API with traffic data
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

    // Auto-calculate distance if destination is set
    if (formData.destination_lat && formData.destination_lng) {
      const result = await calculateDistance(
        location.lat,
        location.lng,
        formData.destination_lat,
        formData.destination_lng,
        formData.departure_time
      );
      newFormData.distance_km = result.distance.toString();
      setFormData(newFormData);
      updatePriceCalculation(newFormData, result.trafficData);
    } else {
      setFormData(newFormData);
      updatePriceCalculation(newFormData);
    }
  };

  const handleDestinationSelect = async (location) => {
    const newFormData = {
      ...formData,
      destination: location.address,
      destination_lat: location.lat,
      destination_lng: location.lng,
    };

    // Auto-calculate distance if origin is set
    if (formData.origin_lat && formData.origin_lng) {
      const result = await calculateDistance(
        formData.origin_lat,
        formData.origin_lng,
        location.lat,
        location.lng,
        formData.departure_time
      );
      newFormData.distance_km = result.distance.toString();
      setFormData(newFormData);
      updatePriceCalculation(newFormData, result.trafficData);
    } else {
      setFormData(newFormData);
      updatePriceCalculation(newFormData);
    }
  };

  const handleUniversityChange = async (e) => {
    const universityId = e.target.value;
    const university = universities.find(u => u.id.toString() === universityId);

    let newFormData = { ...formData, university_id: universityId };

    if (university && formData.direction) {
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
          setFormData(newFormData);
          updatePriceCalculation(newFormData, result.trafficData);
          return;
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
          setFormData(newFormData);
          updatePriceCalculation(newFormData, result.trafficData);
          return;
        }
      }
    }

    setFormData(newFormData);
    updatePriceCalculation(newFormData);
  };

  const handleDirectionChange = (e) => {
    const direction = e.target.value;
    const university = universities.find(u => u.id.toString() === formData.university_id);

    let newFormData = { ...formData, direction };

    if (university) {
      if (direction === 'to_university') {
        newFormData = {
          ...newFormData,
          destination: university.name,
          destination_lat: parseFloat(university.latitude),
          destination_lng: parseFloat(university.longitude),
          origin: '',
          origin_lat: null,
          origin_lng: null,
        };
      } else if (direction === 'from_university') {
        newFormData = {
          ...newFormData,
          origin: university.name,
          origin_lat: parseFloat(university.latitude),
          origin_lng: parseFloat(university.longitude),
          destination: '',
          destination_lat: null,
          destination_lng: null,
        };
      }
    }

    setFormData(newFormData);
    updatePriceCalculation(newFormData);
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
      updatePriceCalculation(newFormData, result.trafficData);
      return;
    }

    if (['distance_km', 'fuel_type', 'available_seats', 'ac_enabled', 'departure_time'].includes(name)) {
      updatePriceCalculation(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        origin: formData.origin,
        destination: formData.destination,
        origin_lat: formData.origin_lat,
        origin_lng: formData.origin_lng,
        destination_lat: formData.destination_lat,
        destination_lng: formData.destination_lng,
        departure_time: formData.departure_time,
        available_seats: parseInt(formData.available_seats),
        description: formData.description,
        gender_preference: formData.gender_preference,
        fuel_type: formData.fuel_type,
        distance_km: parseFloat(formData.distance_km) || null,
        direction: formData.direction || null,
        university_id: formData.university_id ? parseInt(formData.university_id) : null,
        price_per_seat: priceBreakdown?.pricePerSeat || 0,
      };

      await rideAPI.updateRide(id, updateData);
      setSuccess('Ride updated successfully!');
      setTimeout(() => navigate('/driver/my-rides'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ride');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/driver/my-rides')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Rides
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Edit Ride</h1>
          <p className="text-slate-400">Update your ride details</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-900/20 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 space-y-6">
          {/* Direction Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ride Direction</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                formData.direction === 'to_university'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="direction"
                  value="to_university"
                  checked={formData.direction === 'to_university'}
                  onChange={handleDirectionChange}
                  className="sr-only"
                />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                To University
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                formData.direction === 'from_university'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="direction"
                  value="from_university"
                  checked={formData.direction === 'from_university'}
                  onChange={handleDirectionChange}
                  className="sr-only"
                />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                From University
              </label>
            </div>
          </div>

          {/* University Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">University</label>
            <select
              value={formData.university_id}
              onChange={handleUniversityChange}
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

          {/* Location Inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            {formData.direction === 'to_university' ? (
              <>
                <LocationAutocomplete
                  label="Pickup Location"
                  value={formData.origin}
                  onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                  onPlaceSelect={handleOriginSelect}
                  placeholder="Enter pickup location"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Destination (University)</label>
                  <input
                    type="text"
                    value={formData.destination}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-4 py-3 cursor-not-allowed"
                  />
                </div>
              </>
            ) : formData.direction === 'from_university' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pickup (University)</label>
                  <input
                    type="text"
                    value={formData.origin}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg px-4 py-3 cursor-not-allowed"
                  />
                </div>
                <LocationAutocomplete
                  label="Destination"
                  value={formData.destination}
                  onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  onPlaceSelect={handleDestinationSelect}
                  placeholder="Enter destination"
                  required
                />
              </>
            ) : (
              <>
                <LocationAutocomplete
                  label="From"
                  value={formData.origin}
                  onChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                  onPlaceSelect={handleOriginSelect}
                  placeholder="Enter pickup location"
                  required
                />
                <LocationAutocomplete
                  label="To"
                  value={formData.destination}
                  onChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                  onPlaceSelect={handleDestinationSelect}
                  placeholder="Enter destination"
                  required
                />
              </>
            )}
          </div>

          {/* Map Preview */}
          {formData.origin_lat && formData.destination_lat && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Route Preview</label>
              <RouteMap
                originLat={formData.origin_lat}
                originLng={formData.origin_lng}
                destLat={formData.destination_lat}
                destLng={formData.destination_lng}
              />
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
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                <option value="petrol">Petrol (0.15 JOD/km)</option>
                <option value="hybrid">Hybrid (0.10 JOD/km)</option>
                <option value="electric">Electric (0.06 JOD/km)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Distance (KM)
                {formData.distance_km && formData.origin_lat && formData.destination_lat && (
                  <span className="ml-2 text-emerald-400 text-sm">
                    Auto-calculated via Google Maps
                  </span>
                )}
              </label>
              <input
                type="number"
                name="distance_km"
                min="1"
                step="0.1"
                value={formData.distance_km}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

          {/* Price Display */}
          {priceBreakdown && priceBreakdown.pricePerSeat > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Calculated Cost per Seat</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-white">{priceBreakdown.pricePerSeat} JOD</span>
                <span className="text-slate-400">per passenger</span>
              </div>
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

          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/driver/my-rides')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="flex-1"
            >
              {saving ? <LoadingSpinner size="sm" /> : 'Update Ride'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRide;
