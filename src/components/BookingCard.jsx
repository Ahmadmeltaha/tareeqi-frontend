import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import RatingStars from './RatingStars';
import Badge from './Badge';
import Button from './Button';

const BookingCard = ({ booking, userRole = 'passenger', onAction }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    // Parse as UTC to avoid timezone conversion
    const date = new Date(dateString + 'Z');
    const options = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    // Parse as UTC to avoid timezone conversion
    const date = new Date(dateString + 'Z');
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const otherUser = userRole === 'driver' ? {
    name: booking.passenger_name,
    image: booking.passenger_image,
    rating: booking.passenger_rating,
  } : {
    name: booking.driver_name,
    image: booking.driver_image,
    rating: booking.driver_rating,
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-700">
      <div className="p-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={getStatusVariant(booking.status)} size="md">
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
          <span className="text-sm text-slate-400">
            Booking #{booking.id}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-700">
          <UserAvatar
            name={otherUser.name}
            image={otherUser.image}
            size="md"
          />
          <div className="flex-1">
            {userRole === 'passenger' && booking.driver_id ? (
              <h3
                onClick={() => navigate(`/driver/${booking.driver_id}`)}
                className="font-semibold text-white hover:text-emerald-400 cursor-pointer transition-colors"
              >
                {otherUser.name}
              </h3>
            ) : (
              <h3 className="font-semibold text-white">
                {otherUser.name}
              </h3>
            )}
            <div className="flex items-center space-x-2">
              <RatingStars rating={otherUser.rating || 0} size="sm" />
              <span className="text-sm text-slate-400">
                {userRole === 'driver' ? 'Passenger' : 'Driver'}
              </span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-slate-400">From</p>
                <p className="font-medium text-white">{booking.origin}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">To</p>
                <p className="font-medium text-white">{booking.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-slate-400 mb-1">Date</p>
            <p className="font-medium text-white">{formatDate(booking.departure_time)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Time</p>
            <p className="font-medium text-white">{formatTime(booking.departure_time)}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Seats Booked</p>
            <p className="font-medium text-white">{booking.seats_booked}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Total Price</p>
            <p className="font-semibold text-emerald-400">{parseFloat(booking.total_price).toFixed(2)} JOD</p>
          </div>
        </div>

        {/* Actions */}
        {booking.status === 'pending' && userRole === 'driver' && (
          <div className="flex space-x-3 pt-4 border-t border-slate-700">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => onAction && onAction('confirm', booking.id)}
            >
              Confirm
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onClick={() => onAction && onAction('reject', booking.id)}
            >
              Reject
            </Button>
          </div>
        )}

        {booking.status === 'pending' && userRole === 'passenger' && (
          <div className="flex space-x-3 pt-4 border-t border-slate-700">
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={() => navigate(`/rides/${booking.ride_id}`)}
            >
              View Ride
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onClick={() => onAction && onAction('cancel', booking.id)}
            >
              Cancel Request
            </Button>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="flex space-x-3 pt-4 border-t border-slate-700">
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={() => navigate(`/rides/${booking.ride_id}`)}
            >
              View Details
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onClick={() => onAction && onAction('cancel', booking.id)}
            >
              Cancel Booking
            </Button>
          </div>
        )}

        {booking.status === 'completed' && !booking.has_review && userRole === 'passenger' && (
          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => onAction && onAction('review', booking.id)}
            >
              Leave a Review
            </Button>
          </div>
        )}

        {/* Rejected booking message for passenger */}
        {booking.status === 'rejected' && userRole === 'passenger' && (
          <div className="pt-4 border-t border-slate-700">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400 font-medium">Your booking request was rejected by the driver</p>
              <p className="text-slate-400 text-sm mt-1">You can search for other available rides</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
