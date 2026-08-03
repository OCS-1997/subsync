import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/axiosInstance';
import { useBirthdayDetection } from '../hooks/useBirthdayDetection';

const BirthdayExperienceContext = createContext(null);

export const BirthdayExperienceProvider = ({ children }) => {
  const reduxUser = useSelector((state) => state.auth.user);
  const [profileUser, setProfileUser] = useState(null);

  // Combine redux user with fetched profile details to ensure date_of_birth is present
  const user = useMemo(() => {
    return {
      ...reduxUser,
      ...profileUser
    };
  }, [reduxUser, profileUser]);

  // Admin settings state
  const [adminSettings, setAdminSettings] = useState({
    enabled: true,
    enable_theme: true,
    enable_confetti: true,
    enable_dashboard_hero: true,
    animation_duration: 6,
    company_greeting:
      'Thank you for everything you do. We hope this year brings new opportunities, great achievements, good health, and continued success. Have an amazing birthday!',
    enable_birthday_badge: true,
    enable_team_notification: true
  });

  // User preference state ('full' | 'reduced' | 'disabled')
  const [userPreference, setUserPreferenceState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_birthday_preference') || 'full';
    }
    return 'full';
  });

  // Today's team birthdays list
  const [todayTeamBirthdays, setTodayTeamBirthdays] = useState([]);
  const [isIntroActive, setIsIntroActive] = useState(false);

  // Fetch full user profile to ensure date_of_birth is always populated
  const fetchUserProfile = useCallback(async (username) => {
    try {
      const res = await api.get(`/users/${username}`);
      if (res.data) {
        setProfileUser(res.data);
      }
    } catch (e) {
      console.warn('Failed to load user profile for birthday check:', e);
    }
  }, []);

  // Fetch admin settings on mount
  const fetchAdminSettings = useCallback(async () => {
    try {
      const res = await api.get('/birthday-experience/settings');
      if (res.data?.success && res.data.settings) {
        setAdminSettings(res.data.settings);
      }
    } catch (e) {
      console.warn('Failed to load birthday experience admin settings:', e);
    }
  }, []);

  // Fetch team birthdays for today
  const fetchTodayTeamBirthdays = useCallback(async () => {
    try {
      const res = await api.get('/birthday-experience/today-team');
      if (res.data?.success && res.data.birthdays) {
        setTodayTeamBirthdays(res.data.birthdays);
      }
    } catch (e) {
      console.warn('Failed to load today team birthdays:', e);
    }
  }, []);

  useEffect(() => {
    if (reduxUser?.username) {
      fetchUserProfile(reduxUser.username);
      fetchAdminSettings();
      fetchTodayTeamBirthdays();
    }
  }, [reduxUser?.username, fetchUserProfile, fetchAdminSettings, fetchTodayTeamBirthdays]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (reduxUser?.username) {
        fetchUserProfile(reduxUser.username);
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, [reduxUser?.username, fetchUserProfile]);

  // Birthday detection hook
  const {
    isBirthdayToday,
    firstName,
    shouldPlayIntro,
    hasSeenIntro,
    markIntroSeen,
    reducedMotion
  } = useBirthdayDetection(user, userPreference, adminSettings);

  // Automatically start intro if conditions match
  useEffect(() => {
    if (shouldPlayIntro && !isIntroActive) {
      setIsIntroActive(true);
    }
  }, [shouldPlayIntro, isIntroActive]);

  // Apply or remove Birthday Theme CSS class on document element
  useEffect(() => {
    const root = document.documentElement;
    const isThemeEnabled =
      isBirthdayToday &&
      adminSettings.enabled &&
      adminSettings.enable_theme &&
      userPreference !== 'disabled';

    if (isThemeEnabled) {
      root.classList.add('birthday-theme-active');
    } else {
      root.classList.remove('birthday-theme-active');
    }

    return () => {
      root.classList.remove('birthday-theme-active');
    };
  }, [isBirthdayToday, adminSettings.enabled, adminSettings.enable_theme, userPreference]);

  // Handle setting user preference
  const setUserPreference = (pref) => {
    setUserPreferenceState(pref);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_birthday_preference', pref);
    }
  };

  // Handle updating admin settings
  const updateAdminSettings = async (newSettings) => {
    try {
      const res = await api.put('/birthday-experience/settings', newSettings);
      if (res.data?.success) {
        setAdminSettings((prev) => ({ ...prev, ...newSettings }));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to update birthday admin settings:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const completeIntro = useCallback(() => {
    setIsIntroActive(false);
    markIntroSeen();
  }, [markIntroSeen]);

  return (
    <BirthdayExperienceContext.Provider
      value={{
        adminSettings,
        userPreference,
        setUserPreference,
        updateAdminSettings,
        isBirthdayToday,
        firstName,
        shouldPlayIntro,
        hasSeenIntro,
        markIntroSeen,
        isIntroActive,
        setIsIntroActive,
        completeIntro,
        todayTeamBirthdays,
        reducedMotion,
        user
      }}
    >
      {children}
    </BirthdayExperienceContext.Provider>
  );
};

export const useBirthdayExperience = () => {
  const context = useContext(BirthdayExperienceContext);
  if (!context) {
    throw new Error('useBirthdayExperience must be used within a BirthdayExperienceProvider');
  }
  return context;
};
