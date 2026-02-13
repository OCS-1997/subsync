import React, { useState, useEffect } from 'react';
import CallLogPrompt from '@/components/CallLogPrompt/CallLogPrompt';
import { initializeCallLogMonitoring, requestCallLogPermissions, requestNotificationPermission, showCallLogNotification } from '@/components/CallLogPrompt/services/androidCallLogService';
import { storeRecentCall } from '@/components/CallLogPrompt/services/callLogService';

/**
 * CallLogManager - Global manager for call logging
 * Handles Android CallLog events and shows the logging prompt
 * 
 * This component should be mounted in App.jsx or a high-level layout
 */
export default function CallLogManager() {
    const [currentCall, setCurrentCall] = useState(null);
    const [promptOpen, setPromptOpen] = useState(false);
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    // Request permissions on mount
    useEffect(() => {
        const initPermissions = async () => {
            const callLogPermission = await requestCallLogPermissions();
            const notificationPermission = await requestNotificationPermission();
            setPermissionsGranted(callLogPermission);
        };

        initPermissions();
    }, []);

    // Initialize call monitoring
    useEffect(() => {
        // In development, always initialize (for testing)
        // In production, only initialize if permissions granted
        const isDevelopment = import.meta.env.DEV;
        
        if (!isDevelopment && !permissionsGranted) return;

        // Handle call end from Android
        const handleCallEnd = (callData) => {
            //console.log('Call ended:', callData);
            
            // Show notification
            showCallLogNotification(callData);
            
            // Auto-open prompt
            setCurrentCall(callData);
            setPromptOpen(true);
        };

        // Start monitoring
        initializeCallLogMonitoring(handleCallEnd);

        // Listen for manual prompt open (from notification click)
        const handleOpenPrompt = (event) => {
            const callData = event.detail;
            setCurrentCall(callData);
            setPromptOpen(true);
        };

        window.addEventListener('openCallLogPrompt', handleOpenPrompt);

        return () => {
            window.removeEventListener('openCallLogPrompt', handleOpenPrompt);
        };
    }, [permissionsGranted]);

    const handleSkip = (callData) => {
        // Store to Recent Calls
        storeRecentCall(callData);
        setPromptOpen(false);
        setCurrentCall(null);
    };

    const handleClose = () => {
        setPromptOpen(false);
        setCurrentCall(null);
    };

    return (
        <CallLogPrompt
            callData={currentCall}
            open={promptOpen}
            onClose={handleClose}
            onSkip={handleSkip}
        />
    );
}
