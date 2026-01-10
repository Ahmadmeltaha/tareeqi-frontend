import { useState } from 'react';
import Modal from './Modal';

const ReviewModal = ({ isOpen, onClose, booking, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit({ rating, comment });
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Leave a Review"
      size="md"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 font-semibold rounded-lg transition-all text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Ride Info */}
        {booking && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Ride</p>
            <p className="text-white font-medium">
              {booking.origin} → {booking.destination}
            </p>
            <p className="text-sm text-slate-400 mt-2">Driver</p>
            <p className="text-white font-medium">{booking.driver_name}</p>
          </div>
        )}

        {/* Star Rating */}
        <div>
          <label className="block text-sm text-slate-400 mb-3">
            How was your experience?
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-4xl transition-transform hover:scale-110 cursor-pointer"
              >
                {star <= (hoveredRating || rating) ? (
                  <span className="text-yellow-400">★</span>
                ) : (
                  <span className="text-slate-600">★</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-center mt-2 text-sm text-slate-400">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Write a review (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this driver..."
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none placeholder-slate-500"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;
