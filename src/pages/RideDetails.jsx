import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rideAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import RouteMap from '../components/RouteMap';
import UserAvatar from '../components/UserAvatar';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasExistingBooking, setHasExistingBooking] = useState(false);

  useEffect(() => {
    loadRide();
    checkExistingBooking();
  }, [id, user]);

  const loadRide = async () => {
    try {
      const response = await rideAPI.getRide(id);
      setRide(response.data.data);
    } catch (error) {
      console.error('Failed to load ride:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load ride details';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingBooking = async () => {
    if (!user?.id) return;

    try {
      const response = await bookingAPI.getPassengerBookings(user.id);
      const bookings = response.data.data || [];
      const existingBooking = bookings.find(
        booking => parseInt(booking.ride_id) === parseInt(id) && booking.status !== 'cancelled'
      );
      setHasExistingBooking(!!existingBooking);
    } catch (error) {
      console.error('Error checking existing booking:', error);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      await bookingAPI.createBooking({
        ride_id: ride.id,
        seats_booked: bookingSeats,
      });

      setMessage({ type: 'success', text: 'Booking request sent successfully!' });
      setTimeout(() => navigate('/passenger/dashboard'), 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create booking'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-slate-400">Ride not found</p>
        </div>
      </div>
    );
  }

  // Check if user can book based on gender preference
  const genderMatches = !ride.gender_preference ||
    (ride.gender_preference === 'male_only' && user?.gender === 'male') ||
    (ride.gender_preference === 'female_only' && user?.gender === 'female');

  // Check if ride has already departed
  const hasNotDeparted = new Date(ride.departure_time) > new Date();

  const canBook = isAuthenticated && parseInt(user?.id) !== parseInt(ride.driver_id) && ride.available_seats > 0 && genderMatches && !hasExistingBooking && hasNotDeparted;

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-900/20 border border-red-500/50 text-red-400' : 'bg-green-900/20 border border-green-500/50 text-green-400'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Ride Details</h1>

        <div className="space-y-6">
          {/* Map */}
          {ride.origin_lat && ride.destination_lat && (
            <RouteMap
              originLat={ride.origin_lat}
              originLng={ride.origin_lng}
              destLat={ride.destination_lat}
              destLng={ride.destination_lng}
              className="mb-6"
            />
          )}

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xl font-semibold text-white">{ride.origin}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xl font-semibold text-white">{ride.destination}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">
                {parseFloat(ride.price_per_seat).toFixed(2)} JOD
              </div>
              <div className="text-slate-400">per seat</div>
              {parseFloat(ride.traffic_fee) > 0 && (
                <div className="text-xs text-yellow-400">Includes peak hour fee</div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">Departure</div>
              <div className="font-medium text-white">{new Date(ride.departure_time).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Available Seats</div>
              <div className="font-medium text-white">
                {ride.total_seats
                  ? `${ride.available_seats}/${ride.total_seats} seats`
                  : `${ride.available_seats} seats`}
                {ride.available_seats === 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">Full</span>
                )}
              </div>
            </div>
            {ride.distance_km && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Distance</div>
                <div className="font-medium text-white">{ride.distance_km} km</div>
              </div>
            )}
            {ride.gender_preference && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Passengers</div>
                <div className="flex items-center space-x-2">
                  <span>{ride.gender_preference === 'female_only' ? '👩' : '👨'}</span>
                  <span className="font-medium text-white">
                    {ride.gender_preference === 'female_only' ? 'Women Only' : 'Men Only'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {ride.description && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="font-semibold text-white mb-2">Description</h3>
              <p className="text-slate-300">{ride.description}</p>
            </div>
          )}

          <div className="border-t border-slate-700 pt-6">
            <h3 className="font-semibold text-white mb-4">Driver Information</h3>
            <div className="flex items-center gap-4">
              <UserAvatar
                name={ride.driver_name}
                image={ride.driver_picture}
                size="lg"
              />
              <div>
                <div className="text-lg font-medium text-white">{ride.driver_name}</div>
                <div className="flex items-center gap-2">
                  <StarRating rating={ride.driver_rating || 0} size="md" />
                  <span className="text-slate-400">({ride.driver_total_rides || 0} rides)</span>
                </div>
                <div className="text-sm text-slate-400 mt-1">{ride.driver_phone}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="font-semibold text-white mb-2">Vehicle</h3>
            <p className="text-slate-300">{ride.car_make} {ride.car_model} - {ride.car_color}</p>
            <p className="text-sm text-slate-400">{ride.car_plate_number}</p>
          </div>

          {/* Existing booking message */}
          {isAuthenticated && user?.id !== ride.driver_id && hasExistingBooking && (
            <div className="border-t border-slate-700 pt-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-center space-x-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="text-blue-400 font-medium">You already have a booking for this ride</p>
                  <p className="text-slate-400 text-sm">Check your dashboard to view booking details.</p>
                </div>
              </div>
            </div>
          )}

          {/* Ride departed message */}
          {isAuthenticated && user?.id !== ride.driver_id && !hasNotDeparted && (
            <div className="border-t border-slate-700 pt-6">
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 flex items-center space-x-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-slate-300 font-medium">This ride has already departed</p>
                  <p className="text-slate-400 text-sm">You can no longer book this ride.</p>
                </div>
              </div>
            </div>
          )}

          {/* Gender restriction message */}
          {isAuthenticated && user?.id !== ride.driver_id && ride.available_seats > 0 && !genderMatches && !hasExistingBooking && hasNotDeparted && (
            <div className="border-t border-slate-700 pt-6">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 flex items-center space-x-3">
                <span className="text-2xl">{ride.gender_preference === 'female_only' ? '👩' : '👨'}</span>
                <div>
                  <p className="text-yellow-400 font-medium">This ride is for {ride.gender_preference === 'female_only' ? 'women' : 'men'} only</p>
                  <p className="text-slate-400 text-sm">You cannot book this ride due to gender preference.</p>
                </div>
              </div>
            </div>
          )}

          {canBook && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="font-semibold text-white mb-4">Book This Ride</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Number of seats</label>
                  <input
                    type="number"
                    min="1"
                    max={ride.available_seats}
                    value={bookingSeats}
                    onChange={(e) => setBookingSeats(parseInt(e.target.value))}
                    className="w-24 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Total Price</label>
                  <div className="text-2xl font-bold text-emerald-400">
                    {(parseFloat(ride.price_per_seat) * bookingSeats).toFixed(2)} JOD
                  </div>
                </div>
              </div>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="mt-4 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
