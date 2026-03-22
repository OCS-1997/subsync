import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getActiveGuide, dismissGuide } from './releaseGuideService';
import ReleaseGuideModal from './ReleaseGuideModal';

/**
 * ReleaseGuideManager
 * ===================
 * Global, zero-UI manager mounted once in App.jsx.
 *
 * Waits for the user to be authenticated before checking for an active guide,
 * so the modal never shows on the login page — only after a successful login.
 */
export default function ReleaseGuideManager() {
  const [guide, setGuide] = useState(null);
  const [open, setOpen] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  // Ref to ensure we only trigger once per session (not on every re-render)
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run after authentication and only once
    if (!isAuthenticated || hasChecked.current) return;

    // Short defer so the dashboard/route has fully mounted before modal opens
    const timer = setTimeout(() => {
      // If the user just logged in to log a pending call, respect their urgency.
      // We skip showing the release guide for this session so they can focus on the call.
      if (
        localStorage.getItem('subsync_pending_call_after_login') ||
        localStorage.getItem('subsync_pwa_pending_call_after_login')
      ) {
        hasChecked.current = true;
        return;
      }

      hasChecked.current = true;
      const activeGuide = getActiveGuide();
      if (activeGuide) {
        setGuide(activeGuide);
        setOpen(true);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleClose = () => {
    if (guide) {
      dismissGuide(guide.id);
    }
    setOpen(false);
  };

  return (
    <ReleaseGuideModal
      guide={guide}
      open={open}
      onClose={handleClose}
    />
  );
}
