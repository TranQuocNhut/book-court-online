import React, { useState, useEffect } from 'react';

const RotatingText = ({ words, className = '', showBorder = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, [words.length]);

  const borderStyles = showBorder ? {
    background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
    padding: '6px 16px',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    display: 'inline-block',
    minWidth: '120px',
    textAlign: 'center',
  } : {};

  return (
    <div className={`rotating-text ${className}`} style={{ display: 'inline-block' }}>
      <span className="rotating-text-word" style={{
        display: 'inline-block',
        transition: 'all 0.5s ease-in-out',
        minHeight: '1.5em',
        ...borderStyles
      }}>
        {words[currentIndex]}
      </span>
    </div>
  );
};

export default RotatingText;

