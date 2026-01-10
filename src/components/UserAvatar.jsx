const UserAvatar = ({ name, image, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ];

  const getColorForName = (name) => {
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <div className={`${sizes[size]} ${className} relative flex-shrink-0`}>
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full rounded-full object-cover ring-2 ring-gray-200"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center text-white font-semibold ${getColorForName(name)} ring-2 ring-gray-200`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
