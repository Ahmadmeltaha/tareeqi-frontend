import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rideAPI, bookingAPI } from '../services/api';
import RideCard from '../components/RideCard';

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [stats, setStats] = useState({
    totalRides: 0,
    pendingRequests: 0,
    completedRides: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const ridesResponse = await rideAPI.getDriverRides(user.id);
      const ridesData = ridesResponse.data.data || [];
      setRides(ridesData);

      // Filter upcoming rides (scheduled status and future departure time)
      const upcoming = ridesData.filter(r =>
        r.status === 'scheduled' && new Date(r.departure_time) > new Date()
      );
      setUpcomingRides(upcoming);

      // Calculate stats
      const completedRides = ridesData.filter(r => r.status === 'completed').length;
      let pendingRequests = 0;

      // Get bookings for all rides to calculate pending requests
      for (const ride of ridesData) {
        try {
          const bookingsResponse = await bookingAPI.getRideBookings(ride.id);
          const bookings = bookingsResponse.data.data || [];
          pendingRequests += bookings.filter(b => b.status === 'pending').length;
        } catch (err) {
          console.error('Failed to load bookings for ride', ride.id);
        }
      }

      setStats({ totalRides: ridesData.length, pendingRequests, completedRides });
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Driver Dashboard</h1>
            <p className="text-slate-400">Manage your rides and bookings</p>
          </div>
          <button
            onClick={() => navigate('/driver/post-ride')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 cursor-pointer"
          >
            + Post New Ride
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Rides Posted</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalRides}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Completed Rides</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.completedRides}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Rides List */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Upcoming Rides</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : upcomingRides.length > 0 ? (
            <div className="grid gap-4">
              {upcomingRides.slice(0, 5).map((ride) => (
                <RideCard key={ride.id} ride={ride} showBookButton={false} showStatus={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-4">No upcoming rides scheduled</p>
              <button
                onClick={() => navigate('/driver/post-ride')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all cursor-pointer"
              >
                Post a Ride
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
