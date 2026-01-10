const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center';

  const variants = {
    // Primary action - emerald filled
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    // Secondary action - outline style matching dark theme
    secondary: 'bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500',
    // Danger/Cancel - subtle, not aggressive red
    danger: 'bg-slate-800 border border-slate-600 text-slate-300 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400',
    // Ghost - minimal style
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
    // Outline emerald - for secondary positive actions
    outline: 'bg-transparent border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
