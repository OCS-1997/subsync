import React, { useEffect, useState } from 'react';
import './ComingSoon.css'; // Make sure to include the CSS file for animations
import Hamster from '@/components/animations/Hamster.jsx';
const ComingSoon = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading time (for example, 3 seconds)
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="coming-soon-container">
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="message flex flex-col justify-center items-center">
           <Hamster className="flex justify-center items-center" />
          <h1 className="animated-text">Coming Soon!</h1>
          <p>We're working on something exciting. Stay tuned!</p>
        </div>
      )}
    </div>
  );
};

export default ComingSoon;
