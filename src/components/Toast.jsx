import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✓',
      iconBg: 'bg-green-100 text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '✕',
      iconBg: 'bg-red-100 text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠',
      iconBg: 'bg-yellow-100 text-yellow-600',
    },
    info: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: 'ℹ',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
  };

  const style = types[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg transform transition-all duration-300 ${
        style.bg
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${style.iconBg} font-semibold`}>
        {style.icon}
      </div>
      <p className={`${style.text} font-medium`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose && onClose(), 300);
        }}
        className={`${style.text} hover:opacity-70 transition-opacity`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
