import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import RatingStars from './RatingStars';
import Badge from './Badge';

const RideCard = ({
  ride,
  showBookButton = true,
  showStatus = false,
  showUniversity = false,
  onBook,
  onCancel,
  onComplete,
  onEdit,
  isDriverView = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/rides/${ride.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    // Handle both ISO strings and database timestamps
    const cleanDate = dateString.endsWith('Z') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Invalid Date';
    // Handle both ISO strings and database timestamps
    const cleanDate = dateString.endsWith('Z') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const getDirectionLabel = (direction) => {
    if (direction === 'to_university') return 'To Uni';
    if (direction === 'from_university') return 'From Uni';
    return '';
  };

  const isCancelled = ride.status === 'cancelled';

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border rounded-xl transition-all duration-300 overflow-hidden cursor-pointer group ${
      isCancelled
        ? 'border-slate-700/50 opacity-60'
        : 'border-slate-700 hover:border-emerald-500/50'
    }`}>
      <div onClick={handleClick} className="p-6">
        {/* University & Direction Badge */}
        {(showUniversity || ride.university_name || ride.direction) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {ride.university_name && (
              <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium">
                {ride.university_name}
              </span>
            )}
            {ride.direction && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ride.direction === 'to_university'
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-orange-600/20 border border-orange-500/30 text-orange-400'
              }`}>
                {getDirectionLabel(ride.direction)}
              </span>
            )}
          </div>
        )}

        {/* Driver Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <UserAvatar
              name={ride.driver_name}
              image={ride.driver_image}
              size="md"
            />
            <div>
              <h3
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/driver/${ride.driver_id}`);
                }}
                className="font-semibold text-white hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {ride.driver_name}
              </h3>
              <div className="flex items-center space-x-2">
                <RatingStars rating={ride.driver_rating || 0} size="sm" />
                <span className="text-sm text-slate-400">
                  ({ride.total_reviews || 0})
                </span>
              </div>
            </div>
          </div>
          {showStatus && ride.status && (
            <Badge variant={ride.status === 'completed' ? 'success' : ride.status === 'cancelled' ? 'danger' : 'warning'}>
              {ride.status}
            </Badge>
          )}
        </div>

        {/* Route */}
        <div className="mb-4">
          <div className="flex items-start space-x-3 mb-2">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-slate-400">From</p>
                <p className="font-semibold text-white">{ride.origin}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">To</p>
                <p className="font-semibold text-white">{ride.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300">
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span>{formatDate(ride.departure_time)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🕐</span>
              <span>{formatTime(ride.departure_time)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>👥</span>
              <span>
                {ride.total_seats
                  ? `${ride.available_seats}/${ride.total_seats} seats`
                  : `${ride.available_seats} ${ride.available_seats === 1 ? 'seat' : 'seats'}`}
              </span>
              {ride.available_seats === 0 && (
                <Badge variant="danger">Full</Badge>
              )}
            </div>
            {ride.gender_preference && (
              <div className="flex items-center space-x-1">
                <span>{ride.gender_preference === 'female_only' ? '👩' : '👨'}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full">
                  {ride.gender_preference === 'female_only' ? 'Women Only' : 'Men Only'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Car Info */}
        {ride.car_model && (
          <div className="flex items-center space-x-2 text-sm text-slate-300 mb-4">
            <span>🚗</span>
            <span>{ride.car_model} {ride.car_color ? `• ${ride.car_color}` : ''}</span>
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div>
            <span className="text-3xl font-bold text-emerald-400">{parseFloat(ride.price_per_seat).toFixed(2)}</span>
            <span className="text-slate-300"> JOD</span>
            <span className="text-sm text-slate-400 block">per seat</span>
            {parseFloat(ride.traffic_fee) > 0 && (
              <span className="text-xs text-yellow-400 block">Includes peak hour fee</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Driver actions for scheduled rides */}
            {isDriverView && ride.status === 'scheduled' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(ride);
                    else navigate(`/driver/rides/${ride.id}/edit`);
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200 text-sm cursor-pointer"
                  title="Edit Ride"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onComplete) onComplete(ride);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 text-sm cursor-pointer"
                >
                  Complete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCancel) onCancel(ride);
                  }}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 font-semibold rounded-lg transition-all duration-200 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
            {/* Passenger book button */}
            {showBookButton && !isDriverView && ride.available_seats > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBook) onBook(ride);
                  else navigate(`/rides/${ride.id}`);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 text-sm cursor-pointer"
              >
                Book Now
              </button>
            )}
            {showBookButton && !isDriverView && ride.available_seats === 0 && (
              <button
                disabled
                className="px-5 py-2.5 bg-slate-700 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed"
              >
                Full
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
