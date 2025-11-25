import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'calculator-position';

export const useDraggable = (initialPosition = { x: 20, y: 100 }) => {
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialPosition;
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // Only left click

        const rect = dragRef.current?.getBoundingClientRect();
        if (!rect) return;

        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        setIsDragging(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        requestAnimationFrame(() => {
            const newX = e.clientX - offsetRef.current.x;
            const newY = e.clientY - offsetRef.current.y;

            // Boundary constraints
            const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
            const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);

            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: constrainedX, y: constrainedY });
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            // Save position to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        }
    }, [isDragging, position]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setPosition((prev) => {
                const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 320);
                const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 480);

                return {
                    x: Math.max(0, Math.min(prev.x, maxX)),
                    y: Math.max(0, Math.min(prev.y, maxY)),
                };
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        position,
        isDragging,
        dragRef,
        handleMouseDown,
    };
};
