import gsap from 'gsap';

/**
 * Creates and starts the cinematic GSAP Birthday Intro timeline.
 * 
 * @param {Object} refs - DOM references for animation targets
 * @param {Object} options - Animation configuration options
 * @returns {GSAPTimeline}
 */
export const createBirthdayIntroTimeline = (
  { backdropRef, logoRef, titleRef, nameRef, greetingRef, giftRef, buttonRef },
  { onComplete, onConfetti } = {}
) => {
  if (!backdropRef.current) return null;

  // Immediate GPU initial state reset
  gsap.set(
    [logoRef.current, titleRef.current, nameRef.current, greetingRef.current, giftRef.current, buttonRef.current],
    { opacity: 0, force3D: true }
  );

  gsap.set(backdropRef.current, { opacity: 0, backdropFilter: 'blur(0px)' });
  gsap.set(logoRef.current, { scale: 0.6, y: -20 });
  gsap.set(titleRef.current, { y: 20, scale: 0.9 });
  gsap.set(nameRef.current, { y: 20, scale: 0.85 });
  gsap.set(greetingRef.current, { y: 15 });
  gsap.set(giftRef.current, { scale: 0.5, rotation: -12 });
  gsap.set(buttonRef.current, { y: 15 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });

  // Step 1: Backdrop darkens & blurs
  tl.to(backdropRef.current, {
    opacity: 1,
    backdropFilter: 'blur(16px)',
    duration: 0.6
  });

  // Step 2: OCS365 Logo fades in with scale & glow
  if (logoRef.current) {
    tl.to(
      logoRef.current,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.7,
        ease: 'back.out(1.8)'
      },
      '-=0.3'
    );
  }

  // Step 3: Happy Birthday Title animates
  if (titleRef.current) {
    tl.to(
      titleRef.current,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out'
      },
      '-=0.3'
    );
  }

  // Step 4: Employee Name animates
  if (nameRef.current) {
    tl.to(
      nameRef.current,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'back.out(1.6)'
      },
      '-=0.3'
    );
  }

  // Step 5: Personalized Greeting appears
  if (greetingRef.current) {
    tl.to(
      greetingRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.6
      },
      '-=0.2'
    );
  }

  // Step 6: Gift Box pops in & Confetti bursts!
  if (giftRef.current) {
    tl.to(
      giftRef.current,
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)',
        onStart: () => {
          if (onConfetti) onConfetti();
        }
      },
      '-=0.2'
    );
  }

  // Step 7: Continue Button appears
  if (buttonRef.current) {
    tl.to(
      buttonRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.5
      },
      '-=0.2'
    );
  }

  return tl;
};

/**
 * Safely kills and cleans up a GSAP timeline
 */
export const killGSAPTimeline = (tl) => {
  if (tl) {
    tl.kill();
  }
};
