import { useState, useEffect } from 'react';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Custom hook to handle the PWA installation process.
 * Listens for the 'beforeinstallprompt' event and provides controls to trigger the prompt.
 * Respects user's dismiss preferences with localStorage persistence.
 */
export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if the app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
            return;
        }

        // Check if user has dismissed the prompt recently
        const dismissedData = localStorage.getItem(DISMISS_KEY);
        if (dismissedData) {
            try {
                const { timestamp, permanent } = JSON.parse(dismissedData);

                // If permanently dismissed, never show again
                if (permanent) {
                   // console.log('🚫 PWA install prompt permanently dismissed');
                    return;
                }

                // If dismissed recently (within cooldown period), don't show
                const timeSinceDismiss = Date.now() - timestamp;
                if (timeSinceDismiss < DISMISS_DURATION) {
                    const daysRemaining = Math.ceil((DISMISS_DURATION - timeSinceDismiss) / (24 * 60 * 60 * 1000));
                   // console.log(`⏳ PWA install prompt dismissed. Will show again in ${daysRemaining} days`);
                    return;
                }
            } catch (error) {
                // If there's an error parsing, clear the storage
                localStorage.removeItem(DISMISS_KEY);
            }
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show our custom UI
            setIsVisible(true);
           // console.log('✅ PWA beforeinstallprompt sparked');
        };

        const handleAppInstalled = () => {
            // Clear the deferredPrompt so it can be garbage collected
            setDeferredPrompt(null);
            setIsVisible(false);
            setIsInstalled(true);
            // Clear any dismiss data since app is now installed
            localStorage.removeItem(DISMISS_KEY);
           // console.log('🎉 PWA was installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
           // console.log(`👤 User response to the install prompt: ${outcome}`);

        // If user accepted, clear any dismiss data
        if (outcome === 'accepted') {
            localStorage.removeItem(DISMISS_KEY);
        } else {
            // If user declined, save dismiss timestamp
            localStorage.setItem(DISMISS_KEY, JSON.stringify({
                timestamp: Date.now(),
                permanent: false
            }));
        }

        // We used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        // Save dismiss timestamp to localStorage
        localStorage.setItem(DISMISS_KEY, JSON.stringify({
            timestamp: Date.now(),
            permanent: false
        }));
        setIsVisible(false);
       // console.log('⏸️ PWA install prompt dismissed for 7 days');
    };

    return {
        isVisible,
        isInstalled,
        handleInstallClick,
        handleDismiss,
    };
};
