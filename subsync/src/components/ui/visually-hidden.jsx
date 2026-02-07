/*
 * VisuallyHidden Component  
 * For accessibility: hides content visually but keeps it available to screen readers
 */

import React from 'react';

export function VisuallyHidden({ children, ...props }) {
    return (
        <span
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
            }}
            {...props}
        >
            {children}
        </span>
    );
}

export default VisuallyHidden;
