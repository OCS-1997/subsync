import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axiosInstance.js';

/**
 * Read Tracking Hook
 * Tracks article reads with duration and scroll depth
 */
export function useReadTracking(slug, isPublic = false) {
    const startTimeRef = useRef(Date.now());
    const maxScrollRef = useRef(0);
    const hasTrackedRef = useRef(false);

    useEffect(() => {
        if (!slug || !isPublic) return;

        // Track scroll depth
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            const scrollPercentage = Math.round(
                ((scrollTop + windowHeight) / documentHeight) * 100
            );

            maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercentage);
        };

        // Track read on visibility change (user switches tab or closes)
        const handleVisibilityChange = () => {
            if (document.hidden && !hasTrackedRef.current) {
                trackRead();
            }
        };

        // Track read on page unload
        const handleBeforeUnload = () => {
            if (!hasTrackedRef.current) {
                trackRead();
            }
        };

        const trackRead = () => {
            if (hasTrackedRef.current) return;

            const readDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const scrollDepth = maxScrollRef.current;

            // Only track if user spent at least 5 seconds
            if (readDuration < 5) return;

            hasTrackedRef.current = true;

            // Send tracking beacon (non-blocking)
            const trackingData = {
                readDuration,
                scrollDepth
            };

            // Use sendBeacon if available (works even when page is closing)
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(trackingData)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(`/api/kb/public/articles/${slug}/read`, blob);
            } else {
                // Fallback to async POST
                api.post(`/kb/public/articles/${slug}/read`, trackingData).catch(() => {
                    // Silently fail - tracking is not critical
                });
            }
        };

        // Add event listeners
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Track after 30 seconds if still on page
        const timeoutId = setTimeout(() => {
            if (!hasTrackedRef.current) {
                trackRead();
            }
        }, 30000);

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearTimeout(timeoutId);
        };
    }, [slug, isPublic]);
}

/**
 * Read Counter Component
 * Displays read count with animation
 */
export function ReadCounter({ totalReads, uniqueReads }) {
    const [displayReads, setDisplayReads] = useState(0);

    useEffect(() => {
        if (!totalReads) return;

        let current = 0;
        const increment = Math.ceil(totalReads / 30);
        const timer = setInterval(() => {
            current += increment;
            if (current >= totalReads) {
                setDisplayReads(totalReads);
                clearInterval(timer);
            } else {
                setDisplayReads(current);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [totalReads]);

    if (!totalReads) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </svg>
            <span className="font-medium">{displayReads.toLocaleString()}</span>
            {uniqueReads && (
                <span className="text-xs text-gray-500">
                    ({uniqueReads.toLocaleString()} unique)
                </span>
            )}
        </div>
    );
}
