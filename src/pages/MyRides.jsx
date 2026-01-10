import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rideAPI } from '../services/api';
import RideCard from '../components/RideCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const MyRides = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, ride: null });
  const [completeModal, setCompleteModal] = useState({ isOpen: false, ride: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMyRides();
  }, []);

  useEffect(() => {
    filterRides();
  }, [rides, activeTab]);

  const loadMyRides = async () => {
    try {
      const response = await rideAPI.getDriverRides(user.id);
      const ridesData = response.data.data || [];
      setRides(ridesData);
    } catch (error) {
      console.error('Failed to load rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRides = () => {
    let filtered = [...rides];

    if (activeTab === 'upcoming') {
      filtered = rides.filter(ride =>
        ride.status === 'scheduled' && new Date(ride.departure_time) > new Date()
      );
    } else if (activeTab === 'completed') {
      filtered = rides.filter(ride => ride.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = rides.filter(ride => ride.status === 'cancelled');
    }

    setFilteredRides(filtered);
  };

  const handleCancelClick = (ride) => {
    setCancelModal({ isOpen: true, ride });
  };

  const handleCompleteClick = (ride) => {
    setCompleteModal({ isOpen: true, ride });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.ride) return;

    setActionLoading(true);
    try {
      await rideAPI.cancelRide(cancelModal.ride.id);
      await loadMyRides();
      setCancelModal({ isOpen: false, ride: null });
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      alert(error.response?.data?.message || 'Failed to cancel ride. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!completeModal.ride) return;

    setActionLoading(true);
    try {
      await rideAPI.completeRide(completeModal.ride.id);
      await loadMyRides();
      setCompleteModal({ isOpen: false, ride: null });
    } catch (error) {
      console.error('Failed to complete ride:', error);
      alert(error.response?.data?.message || 'Failed to complete ride. Please try again.');
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
            <h1 className="text-4xl font-bold text-white mb-2">My Rides</h1>
            <p className="text-slate-400">Manage all your posted rides</p>
          </div>
          <button
            onClick={() => navigate('/driver/post-ride')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 cursor-pointer"
          >
            + Post New Ride
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Rides</p>
            <p className="text-2xl font-bold text-white mt-1">{rides.length}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Upcoming</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {rides.filter(r => r.status === 'scheduled' && new Date(r.departure_time) > new Date()).length}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {rides.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {rides.filter(r => r.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Rides ({rides.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming ({rides.filter(r => r.status === 'scheduled' && new Date(r.departure_time) > new Date()).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({rides.filter(r => r.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'cancelled'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancelled ({rides.filter(r => r.status === 'cancelled').length})
          </button>
        </div>

        {/* Rides List */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredRides.length > 0 ? (
          <div className="grid gap-4">
            {filteredRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                showBookButton={false}
                showStatus={true}
                isDriverView={true}
                onCancel={handleCancelClick}
                onComplete={handleCompleteClick}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${activeTab !== 'all' ? activeTab : ''} rides found`}
            description={
              activeTab === 'all'
                ? "You haven't posted any rides yet"
                : `You don't have any ${activeTab} rides`
            }
            actionText="Post Your First Ride"
            onAction={() => navigate('/driver/post-ride')}
          />
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, ride: null })}
        title="Cancel Ride"
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCancelModal({ isOpen: false, ride: null })}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg transition-all text-sm cursor-pointer"
            >
              Keep Ride
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Ride'}
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
          <p className="text-lg mb-2">Cancel this ride?</p>
          {cancelModal.ride && (
            <p className="text-slate-400 text-sm">
              {cancelModal.ride.origin} → {cancelModal.ride.destination}
            </p>
          )}
          <p className="text-slate-500 text-sm mt-4">
            All passengers with bookings will be notified.
          </p>
        </div>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal
        isOpen={completeModal.isOpen}
        onClose={() => setCompleteModal({ isOpen: false, ride: null })}
        title="Complete Ride"
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCompleteModal({ isOpen: false, ride: null })}
              className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg transition-all text-sm cursor-pointer"
            >
              Not Yet
            </button>
            <button
              onClick={handleCompleteConfirm}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {actionLoading ? 'Completing...' : 'Mark Complete'}
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg mb-2">Mark this ride as completed?</p>
          {completeModal.ride && (
            <p className="text-slate-400 text-sm">
              {completeModal.ride.origin} → {completeModal.ride.destination}
            </p>
          )}
          <p className="text-slate-500 text-sm mt-4">
            All confirmed bookings will also be marked as completed.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default MyRides;
