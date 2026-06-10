import React from 'react';

export const ConfidenceBadge = ({ level, label }) => {
  return (
    <span className={`confidence confidence-${level}`}>
      <span className="confidence-dot"></span>
      {label && <span>{label}</span>}
    </span>
  );
};
