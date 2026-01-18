import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rideAPI, bookingAPI } from '../services/api';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionModal, setActionModal] = useState({ isOpen: false, action: null, booking: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, activeTab]);

  const loadRequests = async () => {
    try {
      const ridesResponse = await rideAPI.getDriverRides(user.id);
      const rides = ridesResponse.data.data || [];

      const allBookings = [];
      for (const ride of rides) {
        try {
          const bookingsResponse = await bookingAPI.getRideBookings(ride.id);
          const bookings = bookingsResponse.data.data || [];
          bookings.forEach(booking => {
            allBookings.push({
              ...booking,
              origin: ride.origin,
              destination: ride.destination,
              departure_time: ride.departure_time,
            });
          });
        } catch (error) {
          console.error(`Failed to load bookings for ride ${ride.id}:`, error);
        }
      }

      setRequests(allBookings);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (activeTab === 'pending') {
      filtered = requests.filter(r => r.status === 'pending');
    } else if (activeTab === 'confirmed') {
      filtered = requests.filter(r => r.status === 'confirmed');
    } else if (activeTab === 'completed') {
      filtered = requests.filter(r => r.status === 'completed');
    } else if (activeTab === 'rejected') {
      filtered = requests.filter(r => r.status === 'cancelled' || r.status === 'rejected');
    }

    setFilteredRequests(filtered);
  };

  const handleAction = (action, bookingId) => {
    const booking = requests.find(r => r.id === bookingId);
    if (booking) {
      setActionModal({ isOpen: true, action, booking });
    }
  };

  const handleConfirmAction = async () => {
    if (!actionModal.booking || !actionModal.action) return;

    setActionLoading(true);
    try {
      const newStatus = actionModal.action === 'confirm' ? 'confirmed' : 'rejected';
      await bookingAPI.updateBookingStatus(actionModal.booking.id, newStatus);
      await loadRequests();
      setActionModal({ isOpen: false, action: null, booking: null });
    } catch (error) {
      console.error(`Failed to ${actionModal.action} booking:`, error);
      alert(error.response?.data?.message || `Failed to ${actionModal.action} booking. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const confirmedCount = requests.filter(r => r.status === 'confirmed').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Booking Requests</h1>
            <p className="text-slate-400">Manage passenger requests for your rides</p>
          </div>
          <button
            onClick={() => navigate('/driver/my-rides')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-300 cursor-pointer border border-slate-700"
          >
            View My Rides
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{confirmedCount}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'confirmed'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'rejected'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredRequests.length > 0 ? (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <BookingCard
                key={request.id}
                booking={request}
                userRole="driver"
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${activeTab} requests`}
            description={
              activeTab === 'pending'
                ? "You don't have any pending booking requests"
                : `You don't have any ${activeTab} requests`
            }
            actionText="Post a New Ride"
            onAction={() => navigate('/driver/post-ride')}
          />
        )}
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null, booking: null })}
        title={actionModal.action === 'confirm' ? 'Confirm Booking' : 'Reject Booking'}
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActionModal({ isOpen: false, action: null, booking: null })}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`px-5 py-2.5 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer ${
                actionModal.action === 'confirm'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 border border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400'
              }`}
            >
              {actionLoading
                ? (actionModal.action === 'confirm' ? 'Confirming...' : 'Rejecting...')
                : (actionModal.action === 'confirm' ? 'Confirm Booking' : 'Reject Booking')
              }
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            actionModal.action === 'confirm' ? 'bg-emerald-600/20' : 'bg-slate-800'
          }`}>
            {actionModal.action === 'confirm' ? (
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-lg mb-2">
            {actionModal.action === 'confirm'
              ? 'Confirm this booking request?'
              : 'Reject this booking request?'
            }
          </p>
          {actionModal.booking && (
            <>
              <p className="text-slate-400 text-sm">
                {actionModal.booking.passenger_name} - {actionModal.booking.seats_booked} seat(s)
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {actionModal.booking.origin} → {actionModal.booking.destination}
              </p>
            </>
          )}
          <p className="text-slate-500 text-sm mt-4">
            {actionModal.action === 'confirm'
              ? 'The passenger will be notified of confirmation.'
              : 'The passenger will be notified that their request was rejected.'
            }
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
