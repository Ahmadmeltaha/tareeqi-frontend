import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, reviewAPI } from '../services/api';
import BookingCard from '../components/BookingCard';
import Modal from '../components/Modal';
import ReviewModal from '../components/ReviewModal';

const PassengerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    ridesTaken: 0,
    upcomingRides: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadPassengerData();
  }, []);

  const loadPassengerData = async () => {
    try {
      const response = await bookingAPI.getPassengerBookings(user.id);
      const bookingsData = response.data.data || [];
      setBookings(bookingsData);

      // Calculate stats
      const ridesTaken = bookingsData.filter(b => b.status === 'completed').length;
      const upcomingRides = bookingsData.filter(b =>
        b.status === 'confirmed' || b.status === 'pending'
      ).length;
      const totalSpent = bookingsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

      setStats({
        ridesTaken,
        upcomingRides,
        totalSpent: totalSpent.toFixed(2)
      });
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = (action, bookingId) => {
    if (action === 'cancel') {
      setCancelModal({ isOpen: true, bookingId });
    } else if (action === 'review') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setReviewModal({ isOpen: true, booking });
      }
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewModal.booking) return;

    const booking = reviewModal.booking;
    console.log('Submitting review for booking:', booking);
    console.log('booking_id:', booking.id, 'driver_id:', booking.driver_id, 'rating:', rating);

    if (!booking.driver_id) {
      alert('Error: Driver ID not found. Please refresh the page and try again.');
      return;
    }

    setReviewLoading(true);
    try {
      await reviewAPI.createReview({
        booking_id: booking.id,
        reviewee_id: booking.driver_id,
        rating,
        comment
      });
      setReviewModal({ isOpen: false, booking: null });
      await loadPassengerData();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.bookingId) return;

    setActionLoading(true);
    try {
      await bookingAPI.cancelBooking(cancelModal.bookingId);
      await loadPassengerData();
      setCancelModal({ isOpen: false, bookingId: null });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Passenger Dashboard</h1>
            <p className="text-slate-400">Track your rides and bookings</p>
          </div>
          <button
            onClick={() => navigate('/passenger/search')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 cursor-pointer"
          >
            Search Rides
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Rides Taken</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.ridesTaken}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Upcoming Rides</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.upcomingRides}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalSpent} JOD</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  userRole="passenger"
                  onAction={handleBookingAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-4">You haven't made any bookings yet</p>
              <button
                onClick={() => navigate('/passenger/search')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all cursor-pointer"
              >
                Search for Rides
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        title="Cancel Booking"
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCancelModal({ isOpen: false, bookingId: null })}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg transition-all text-sm cursor-pointer"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg mb-2">Cancel this booking?</p>
          <p className="text-slate-500 text-sm mt-4">
            You can book this ride again if seats are still available.
          </p>
        </div>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, booking: null })}
        booking={reviewModal.booking}
        onSubmit={handleReviewSubmit}
        loading={reviewLoading}
      />
    </div>
  );
};

export default PassengerDashboard;
