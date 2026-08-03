const BirthdayCakeSVG = ({ isLit = true, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer select-none transition-transform duration-300 hover:scale-105 ${className}`}
      title="Click to light up candles!"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-24 w-24 drop-shadow-lg md:h-28 md:w-28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cake Plate */}
        <ellipse cx="60" cy="102" rx="48" ry="8" fill="#CBD5E1" className="dark:fill-slate-700" />
        <ellipse cx="60" cy="100" rx="44" ry="7" fill="#F1F5F9" className="dark:fill-slate-600" />

        {/* Cake Bottom Tier */}
        <path
          d="M 22 70 L 22 94 C 22 100 98 100 98 94 L 98 70 Z"
          fill="url(#cakeBottomGradient)"
        />
        <ellipse cx="60" cy="70" rx="38" ry="6" fill="#F472B6" />

        {/* Frosting drips */}
        <path
          d="M 22 70 Q 30 82 38 70 Q 46 84 54 70 Q 62 82 70 70 Q 78 84 86 70 Q 94 82 98 70"
          fill="none"
          stroke="#FFF"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Cake Top Tier */}
        <path
          d="M 32 46 L 32 68 C 32 73 88 73 88 68 L 88 46 Z"
          fill="url(#cakeTopGradient)"
        />
        <ellipse cx="60" cy="46" rx="28" ry="5" fill="#FB7185" />

        {/* Candles */}
        {/* Candle 1 */}
        <rect x="44" y="28" width="4" height="18" rx="2" fill="#38BDF8" />
        {/* Candle 2 */}
        <rect x="58" y="24" width="4" height="22" rx="2" fill="#FACC15" />
        {/* Candle 3 */}
        <rect x="72" y="28" width="4" height="18" rx="2" fill="#A855F7" />

        {/* Flames */}
        {isLit && (
          <g className="animate-pulse">
            {/* Flame 1 */}
            <path d="M 46 28 C 43 22 46 16 46 16 C 46 16 49 22 46 28 Z" fill="#F97316" />
            <circle cx="46" cy="24" r="2" fill="#FEF08A" />

            {/* Flame 2 */}
            <path d="M 60 24 C 57 17 60 11 60 11 C 60 11 63 17 60 24 Z" fill="#EF4444" />
            <circle cx="60" cy="19" r="2.5" fill="#FEF08A" />

            {/* Flame 3 */}
            <path d="M 74 28 C 71 22 74 16 74 16 C 74 16 77 22 74 28 Z" fill="#F97316" />
            <circle cx="74" cy="24" r="2" fill="#FEF08A" />
          </g>
        )}

        <defs>
          <linearGradient id="cakeBottomGradient" x1="22" y1="70" x2="98" y2="94" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FB7185" />
            <stop offset="1" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="cakeTopGradient" x1="32" y1="46" x2="88" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F472B6" />
            <stop offset="1" stopColor="#DB2777" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-1 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
        {isLit ? '🔥 Candles Glowing' : '✨ Click Candles'}
      </div>
    </div>
  );
};

export default BirthdayCakeSVG;
