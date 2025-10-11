import React from 'react';

export const LoadingSpinner: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
    className={`animate-spin h-5 w-5 ${props.className || ''}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.75V6.25m0 11.5v1.5m7.4-7.4l-1.06-1.06M6.66 17.34l-1.06-1.06m11.72-9.62l-1.06 1.06M6.66 6.66l-1.06 1.06M4.75 12H6.25m11.5 0h1.5"
    />
  </svg>
);
