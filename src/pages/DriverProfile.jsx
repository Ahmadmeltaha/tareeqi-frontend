import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driverAPI, reviewAPI } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import LoadingSpinner from '../components/LoadingSpinner';

const DriverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, [id]);

  const loadDriverData = async () => {
    try {
      const [driverRes, reviewsRes] = await Promise.all([
        driverAPI.getProfile(id),
        reviewAPI.getUserReviews(id)
      ]);

      setDriver(driverRes.data.data);
      setReviews(reviewsRes.data.data.reviews || []);
      setStats(reviewsRes.data.data.stats);
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingPercentage = (count) => {
    if (!stats || !stats.total_reviews || stats.total_reviews === 0) return 0;
    return Math.round((count / stats.total_reviews) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-slate-400">Driver not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Driver Info Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex items-start space-x-6">
            <UserAvatar
              name={driver.full_name}
              image={driver.profile_picture}
              size="xl"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{driver.full_name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {renderStars(Math.round(driver.rating || 0))}
                  <span className="ml-2 text-white font-semibold">
                    {driver.rating ? parseFloat(driver.rating).toFixed(1) : '0.0'}
                  </span>
                </div>
                <span className="text-slate-400">
                  ({stats?.total_reviews || 0} reviews)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <span>{driver.total_rides || 0} rides completed</span>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Vehicle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-400">Make</p>
                <p className="text-white font-medium">{driver.car_make}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Model</p>
                <p className="text-white font-medium">{driver.car_model}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Year</p>
                <p className="text-white font-medium">{driver.car_year}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Color</p>
                <p className="text-white font-medium">{driver.car_color}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>

          {/* Rating Breakdown */}
          {stats && stats.total_reviews > 0 && (
            <div className="mb-8 p-6 bg-slate-800/50 rounded-xl">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">
                    {stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : '0.0'}
                  </div>
                  <div className="mt-2">{renderStars(Math.round(stats.average_rating || 0))}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    {stats.total_reviews} reviews
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`] || 0;
                    const percentage = getRatingPercentage(count);
                    return (
                      <div key={star} className="flex items-center space-x-3">
                        <span className="text-sm text-slate-400 w-3">{star}</span>
                        <span className="text-yellow-400">★</span>
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50"
                >
                  <div className="flex items-start space-x-4">
                    <UserAvatar
                      name={review.reviewer_name}
                      image={review.reviewer_picture}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{review.reviewer_name}</h4>
                        <span className="text-sm text-slate-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <div className="mb-3">{renderStars(review.rating)}</div>
                      {review.comment && (
                        <p className="text-slate-300">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-slate-400">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
