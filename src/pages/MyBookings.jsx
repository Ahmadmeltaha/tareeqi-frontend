import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, reviewAPI } from '../services/api';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewModal from '../components/ReviewModal';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewModal, setReviewModal] = useState({ isOpen: false, booking: null });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const loadBookings = async () => {
    try {
      const response = await bookingAPI.getPassengerBookings(user.id);
      const bookingsData = response.data.data || [];
      setBookings(bookingsData);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (activeTab === 'upcoming') {
      filtered = bookings.filter(booking =>
        (booking.status === 'confirmed' || booking.status === 'pending') &&
        new Date(booking.departure_time) > new Date()
      );
    } else if (activeTab === 'pending') {
      filtered = bookings.filter(booking => booking.status === 'pending');
    } else if (activeTab === 'confirmed') {
      filtered = bookings.filter(booking => booking.status === 'confirmed');
    } else if (activeTab === 'completed') {
      filtered = bookings.filter(booking => booking.status === 'completed');
    } else if (activeTab === 'rejected') {
      filtered = bookings.filter(booking => booking.status === 'rejected');
    } else if (activeTab === 'cancelled') {
      filtered = bookings.filter(booking => booking.status === 'cancelled');
    }

    setFilteredBookings(filtered);
  };

  const handleBookingAction = async (action, bookingId) => {
    try {
      if (action === 'cancel') {
        await bookingAPI.cancelBooking(bookingId);
        await loadBookings();
      } else if (action === 'review') {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          setReviewModal({ isOpen: true, booking });
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
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
      await loadBookings();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-slate-400">Track all your ride bookings</p>
          </div>
          <button
            onClick={() => navigate('/passenger/search')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 cursor-pointer"
          >
            Search Rides
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-white mt-1">{bookings.length}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Upcoming</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">
              {bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.departure_time) > new Date()).length}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {bookings.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {bookings.filter(b => b.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming ({bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.departure_time) > new Date()).length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'confirmed'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'completed'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'rejected'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected ({bookings.filter(b => b.status === 'rejected').length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'cancelled'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredBookings.length > 0 ? (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                userRole="passenger"
                onAction={handleBookingAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${activeTab} bookings`}
            description={
              activeTab === 'upcoming'
                ? "You don't have any upcoming rides booked"
                : `You don't have any ${activeTab} bookings`
            }
            actionText="Search for Rides"
            onAction={() => navigate('/passenger/search')}
          />
        )}
      </div>

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

export default MyBookings;
