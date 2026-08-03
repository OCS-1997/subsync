import { useState, useRef } from 'react';
import { useBirthdayExperience } from '../hooks/useBirthdayExperience';
import FloatingParticles from '../assets/FloatingParticles';
import ConfettiCanvas from '../assets/ConfettiCanvas';
import BalloonSVG from '../assets/BalloonSVG';
import BirthdayCakeSVG from '../assets/BirthdayCakeSVG';
import GiftBoxSVG from '../assets/GiftBoxSVG';

const ENCOURAGING_MESSAGES = [
  "You're awesome!",
  'Keep building amazing things.',
  "Here's to another successful year!",
  'Wishing you lots of success & happiness.',
  'Keep solving impossible problems.',
  'Your hard work makes a huge difference!',
  'May this year bring your biggest accomplishments yet.'
];

const BirthdayDashboardHero = () => {
  const { isBirthdayToday, firstName, adminSettings } = useBirthdayExperience();
  const [isCakeLit, setIsCakeLit] = useState(true);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const confettiRef = useRef(null);

  if (!isBirthdayToday || !adminSettings.enabled || !adminSettings.enable_dashboard_hero) {
    return null;
  }

  const handleBalloonPop = () => {
    if (adminSettings.enable_confetti && confettiRef.current) {
      confettiRef.current.burst();
    }
  };

  const handleGiftClick = () => {
    setIsGiftOpen(true);
    const randomMsg = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
    setCurrentQuote(randomMsg);

    if (adminSettings.enable_confetti && confettiRef.current) {
      confettiRef.current.burst();
    }
  };

  const handleCakeClick = () => {
    setIsCakeLit((prev) => !prev);
    if (adminSettings.enable_confetti && confettiRef.current) {
      confettiRef.current.burst();
    }
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl dark:border-amber-400/20 md:p-8">
      {/* Background Particles & Confetti Canvas */}
      <FloatingParticles count={30} className="opacity-60" />
      <ConfettiCanvas ref={confettiRef} />

      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
        {/* Left Side: Greeting & Message */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
            <span>🎂 Special Celebration</span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Happy Birthday,{' '}
            <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-pink-400 bg-clip-text text-transparent">
              {firstName}!
            </span>
          </h1>

          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
            We’re celebrating you today! Thank you for being an irreplaceable part of OCS. Have an incredible year ahead.
          </p>

          {/* Opened Gift Message Popover */}
          {isGiftOpen && currentQuote && (
            <div className="mt-4 inline-block animate-bounce rounded-2xl border border-purple-400/40 bg-purple-900/60 px-4 py-2 text-xs font-bold text-amber-200 backdrop-blur shadow-lg">
              ✨ Message for you: &quot;{currentQuote}&quot;
            </div>
          )}
        </div>

        {/* Right Side: Interactive Elements (Balloons, Cake, Gift) */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <BalloonSVG color="#F43F5E" label="Pop me!" onPop={handleBalloonPop} />
          <BalloonSVG color="#EAB308" label="Pop me!" onPop={handleBalloonPop} />
          <BirthdayCakeSVG isLit={isCakeLit} onClick={handleCakeClick} />
          <GiftBoxSVG isOpen={isGiftOpen} onClick={handleGiftClick} />
        </div>
      </div>
    </div>
  );
};

export default BirthdayDashboardHero;
