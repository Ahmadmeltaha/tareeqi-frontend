const RatingStars = ({ rating = 0, maxRating = 5, size = 'md', showNumber = false, className = '' }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= maxRating; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} className="relative inline-block">
          <span className="text-gray-300">★</span>
          <span className="absolute top-0 left-0 overflow-hidden w-1/2 text-yellow-400">
            ★
          </span>
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300">
          ★
        </span>
      );
    }
  }

  return (
    <div className={`flex items-center space-x-1 ${sizes[size]} ${className}`}>
      <div className="flex">{stars}</div>
      {showNumber && (
        <span className="text-gray-600 font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
