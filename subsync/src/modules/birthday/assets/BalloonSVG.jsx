import { useState } from 'react';

const BalloonSVG = ({ color = '#F43F5E', label = '', onPop, className = '' }) => {
  const [popped, setPopped] = useState(false);

  const handleClick = () => {
    if (popped) return;
    setPopped(true);
    if (onPop) onPop();
  };

  if (popped) {
    return (
      <div className={`flex flex-col items-center justify-center p-2 text-xs font-bold text-amber-500 animate-ping ${className}`}>
        💥 Pop!
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer select-none transition-transform duration-300 hover:scale-110 ${className}`}
      title="Click to pop!"
    >
      <svg
        viewBox="0 0 80 120"
        className="h-24 w-20 drop-shadow-md md:h-28 md:w-24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Balloon String */}
        <path
          d="M 40 85 Q 48 100 38 115"
          stroke="#94A3B8"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Balloon Body */}
        <path
          d="M 40 10 C 15 10 10 45 40 80 C 70 45 65 10 40 10 Z"
          fill={color}
        />

        {/* Highlight */}
        <ellipse cx="28" cy="28" rx="6" ry="12" fill="#FFF" fillOpacity="0.3" transform="rotate(-20 28 28)" />

        {/* Knot */}
        <polygon points="36,80 44,80 40,86" fill={color} />
      </svg>
      {label && <div className="text-center text-[10px] font-semibold text-slate-500">{label}</div>}
    </div>
  );
};

export default BalloonSVG;
