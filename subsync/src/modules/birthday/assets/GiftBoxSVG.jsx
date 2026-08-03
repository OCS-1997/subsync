const GiftBoxSVG = ({ isOpen = false, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer select-none transition-transform duration-300 hover:scale-105 ${className}`}
      title="Click to open gift!"
    >
      <svg
        viewBox="0 0 100 100"
        className="h-24 w-24 drop-shadow-xl md:h-28 md:w-28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="36" ry="6" fill="#000" fillOpacity="0.2" />

        {/* Box Base */}
        <rect x="20" y="45" width="60" height="40" rx="4" fill="url(#giftBoxGrad)" />

        {/* Vertical Ribbon */}
        <rect x="44" y="45" width="12" height="40" fill="#FACC15" />

        {/* Horizontal Ribbon */}
        <rect x="20" y="60" width="60" height="10" fill="#EAB308" />

        {/* Gift Lid */}
        <g
          className={`transition-transform duration-500 ease-bounce ${
            isOpen ? '-translate-y-6 -rotate-12 transform' : ''
          }`}
        >
          <rect x="16" y="35" width="68" height="14" rx="3" fill="url(#giftLidGrad)" />
          <rect x="44" y="35" width="12" height="14" fill="#FACC15" />

          {/* Ribbon Bow */}
          <path
            d="M 50 35 C 38 20 28 32 44 35 C 28 32 38 20 50 35 Z"
            fill="#FEF08A"
          />
          <path
            d="M 50 35 C 62 20 72 32 56 35 C 72 32 62 20 50 35 Z"
            fill="#FDE047"
          />
          <circle cx="50" cy="35" r="4" fill="#EAB308" />
        </g>

        <defs>
          <linearGradient id="giftBoxGrad" x1="20" y1="45" x2="80" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="giftLidGrad" x1="16" y1="35" x2="84" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-1 text-center text-xs font-semibold text-purple-600 dark:text-purple-400">
        {isOpen ? '🎁 Gift Opened!' : '🎁 Click to Open'}
      </div>
    </div>
  );
};

export default GiftBoxSVG;
