import React from 'react';

interface MashreqLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MashreqLogo: React.FC<MashreqLogoProps> = ({ 
  className = "w-9 h-9", 
  showText = false,
  size = 'md'
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8300] via-[#F37021] to-[#D95300] shadow-md shadow-orange-500/30 overflow-hidden shrink-0 border border-orange-400/40 ${className}`}
      title="Mashreq Bank"
    >
      {/* Background glow subtle effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full p-1.5 drop-shadow-sm" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mashreq Sunburst / Fan Petals fanning outwards */}
        <g fill="#FFFFFF">
          {/* Horizontal bottom leaf */}
          <path d="M 30,120 C 60,110 110,120 135,130 C 110,140 60,145 30,120 Z" />
          
          {/* Diagonal lower-left leaf */}
          <path d="M 60,85 C 85,82 120,105 138,125 C 118,128 80,120 60,85 Z" />
          
          {/* Diagonal upper-left leaf */}
          <path d="M 95,60 C 115,65 132,95 142,122 C 122,118 100,95 95,60 Z" />
          
          {/* Top vertical leaf 1 */}
          <path d="M 130,50 C 142,62 145,92 148,120 C 132,110 120,80 130,50 Z" />
          
          {/* Top vertical leaf 2 */}
          <path d="M 160,65 C 166,78 158,102 154,121 C 145,108 145,85 160,65 Z" />

          {/* Right leaf 1 */}
          <path d="M 178,88 C 180,98 168,115 160,123 C 154,115 162,98 178,88 Z" />

          {/* Far right small leaf */}
          <path d="M 188,115 C 188,122 178,128 170,129 C 170,123 178,118 188,115 Z" />
        </g>

        {showText && (
          <text 
            x="100" 
            y="172" 
            fill="#FFFFFF" 
            fontSize="26" 
            fontWeight="900" 
            textAnchor="middle" 
            fontFamily="sans-serif"
            letterSpacing="1"
          >
            mashreq
          </text>
        )}
      </svg>
    </div>
  );
};
