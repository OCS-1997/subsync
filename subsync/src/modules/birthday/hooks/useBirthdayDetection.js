import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * Utility to format Date as YYYY-MM-DD string
 */
const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Parse month and day from any date format (YYYY-MM-DD, DD-MM-YYYY, ISO strings, etc.)
 */
const parseMonthAndDay = (dob) => {
  if (!dob) return null;

  if (dob instanceof Date && !isNaN(dob.getTime())) {
    return { month: dob.getMonth() + 1, day: dob.getDate() };
  }

  if (typeof dob !== 'string') return null;

  const clean = dob.trim().split('T')[0];

  // Try YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return { month: parseInt(ymdMatch[2], 10), day: parseInt(ymdMatch[3], 10) };
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return { month: parseInt(dmyMatch[2], 10), day: parseInt(dmyMatch[1], 10) };
  }

  // Fallback to JS Date constructor
  const d = new Date(dob);
  if (!isNaN(d.getTime())) {
    return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  return null;
};

/**
 * Custom hook to detect user birthday and manage session playback state
 */
export const useBirthdayDetection = (user, userPreference = 'full', adminSettings = {}) => {
  const todayStr = getTodayDateStr();

  // Check prefers-reduced-motion media query
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Determine if today is user's birthday
  const isBirthdayToday = useMemo(() => {
    if (!adminSettings.enabled) return false;
    if (!user || !user.date_of_birth) return false;

    try {
      const parsed = parseMonthAndDay(user.date_of_birth);
      if (!parsed) return false;

      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      return todayMonth === parsed.month && todayDay === parsed.day;
    } catch (e) {
      console.warn('Error parsing user date of birth:', e);
      return false;
    }
  }, [user, adminSettings.enabled]);

  // Extract employee first name
  const firstName = useMemo(() => {
    if (!user || !user.name) return 'Teammate';
    return user.name.trim().split(' ')[0] || 'Teammate';
  }, [user]);

  // Check session storage to ensure intro plays ONLY ONCE per session
  const sessionKey = useMemo(() => {
    return `birthday_intro_played_${user?.username || 'user'}_${todayStr}`;
  }, [user?.username, todayStr]);

  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(sessionKey) === 'true';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSeenIntro(sessionStorage.getItem(sessionKey) === 'true');
    }
  }, [sessionKey]);

  const markIntroSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true');
    }
    setHasSeenIntro(true);
  }, [sessionKey]);

  // Evaluate if intro should play right now
  const shouldPlayIntro = useMemo(() => {
    if (!isBirthdayToday) return false;
    if (userPreference === 'disabled') return false;
    if (userPreference === 'reduced' || reducedMotion) return false;
    if (hasSeenIntro) return false;
    return true;
  }, [isBirthdayToday, userPreference, reducedMotion, hasSeenIntro]);

  return {
    isBirthdayToday,
    firstName,
    shouldPlayIntro,
    hasSeenIntro,
    markIntroSeen,
    reducedMotion
  };
};
