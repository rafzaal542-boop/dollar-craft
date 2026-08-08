import React from 'react';

interface PaypalLogoProps {
  className?: string;
}

export const PaypalLogo: React.FC<PaypalLogoProps> = ({ className = "w-9 h-9" }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-blue-500/30 overflow-hidden shrink-0 border border-blue-200/80 ${className}`}
      title="PayPal"
    >
      <svg 
        viewBox="0 0 500 500" 
        className="w-full h-full drop-shadow-sm" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Right Light Blue 'P' (Behind) */}
        <path 
          d="M210 130 H320 C380 130 420 160 410 220 C398 280 340 320 280 320 H220 L195 450 H140 L210 130 Z" 
          fill="#0079C1" 
        />
        {/* Left Dark Blue 'P' (In Front) */}
        <path 
          d="M150 70 H260 C320 70 360 100 350 160 C338 220 280 260 220 260 H160 L135 390 H80 L150 70 Z" 
          fill="#003087" 
        />
        {/* Overlap area tint for depth */}
        <path 
          d="M210 130 H260 C320 130 350 160 342 210 C322 250 280 260 220 260 H160 L180 160 L210 130 Z" 
          fill="#002060" 
          opacity="0.25"
        />
      </svg>
    </div>
  );
};
