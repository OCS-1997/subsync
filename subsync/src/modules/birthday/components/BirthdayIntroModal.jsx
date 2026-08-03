import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useBirthdayExperience } from '../hooks/useBirthdayExperience';
import { createBirthdayIntroTimeline, killGSAPTimeline } from '../animations/gsapSequences';
import FloatingParticles from '../assets/FloatingParticles';
import ConfettiCanvas from '../assets/ConfettiCanvas';
import GiftBoxSVG from '../assets/GiftBoxSVG';

const BirthdayIntroModal = () => {
  const {
    isIntroActive,
    completeIntro,
    firstName,
    adminSettings
  } = useBirthdayExperience();

  const backdropRef = useRef(null);
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const nameRef = useRef(null);
  const greetingRef = useRef(null);
  const giftRef = useRef(null);
  const buttonRef = useRef(null);
  const confettiRef = useRef(null);
  const timelineRef = useRef(null);

  const handleConfetti = useCallback(() => {
    if (adminSettings.enable_confetti && confettiRef.current) {
      confettiRef.current.burst();
    }
  }, [adminSettings.enable_confetti]);

  const handleSkip = useCallback(() => {
    killGSAPTimeline(timelineRef.current);
    handleConfetti();
    completeIntro();
  }, [handleConfetti, completeIntro]);

  useEffect(() => {
    if (!isIntroActive) return;

    // Build & trigger GSAP animation timeline
    timelineRef.current = createBirthdayIntroTimeline(
      {
        backdropRef,
        containerRef,
        logoRef,
        titleRef,
        nameRef,
        greetingRef,
        giftRef,
        buttonRef
      },
      {
        duration: adminSettings.animation_duration || 6,
        onConfetti: handleConfetti
      }
    );

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      killGSAPTimeline(timelineRef.current);
    };
  }, [isIntroActive, adminSettings.animation_duration, handleConfetti, handleSkip]);

  if (!isIntroActive) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden">
      {/* Full Viewport Darkened & Blurred Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl transition-all duration-500"
      />

      {/* Floating Particles Background */}
      <FloatingParticles count={60} className="z-0" />

      {/* GPU Confetti Canvas */}
      <ConfettiCanvas ref={confettiRef} />

      {/* Skip Animation Button - Accessible at all times */}
      <div className="absolute right-6 top-6 z-[100000]">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          className="border-amber-500/40 bg-slate-900/80 text-xs font-bold text-amber-300 backdrop-blur-md hover:bg-amber-500/20 hover:text-amber-200"
        >
          Skip Animation ⚡
        </Button>
      </div>

      {/* Main Experience Card */}
      <div
        ref={containerRef}
        className="relative z-10 mx-4 max-w-xl rounded-3xl border border-amber-500/40 bg-slate-950/90 p-8 text-center shadow-2xl backdrop-blur-2xl md:p-12"
      >
        {/* Glowing OCS365 Logo */}
        <div ref={logoRef} className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-lg shadow-rose-500/30">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 font-black text-2xl tracking-tighter text-amber-400">
              OCS
            </div>
          </div>
        </div>

        {/* Animated Title */}
        <h2
          ref={titleRef}
          className="bg-gradient-to-r from-amber-300 via-rose-300 to-pink-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
        >
          Happy Birthday 🎉
        </h2>

        {/* Employee Name */}
        <h1
          ref={nameRef}
          className="mt-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-rose-400 bg-clip-text text-4xl font-black tracking-normal text-transparent sm:text-5xl"
        >
          {firstName}
        </h1>

        {/* Personalized Company Greeting */}
        <p
          ref={greetingRef}
          className="mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-300 sm:text-base"
        >
          {adminSettings.company_greeting ||
            'Thank you for everything you do. We hope this year brings new opportunities, great achievements, good health, and continued success. Have an amazing birthday!'}
        </p>

        {/* Gift Animation */}
        <div ref={giftRef} className="mt-6 flex justify-center">
          <GiftBoxSVG isOpen={true} />
        </div>

        {/* Continue Button */}
        <div ref={buttonRef} className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleSkip}
            className="h-12 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-8 text-base font-bold text-white shadow-lg shadow-rose-500/25 transition-transform duration-200 hover:scale-105"
          >
            Enter Dashboard ✨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BirthdayIntroModal;
