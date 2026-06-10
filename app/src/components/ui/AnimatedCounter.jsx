import React, { useEffect, useState } from 'react';

export const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 2, duration = 500 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = null;
    const endValue = parseFloat(value) || 0;
    const initialValue = displayValue;
    const diff = endValue - initialValue;

    if (diff === 0) return;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutQuad)
      const easePercentage = percentage * (2 - percentage);
      
      setDisplayValue(initialValue + (diff * easePercentage));

      if (percentage < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
};
