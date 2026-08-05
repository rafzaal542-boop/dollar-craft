import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_6px_16px_rgba(14,165,233,0.4)] transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Main Metallic Blue Front Face Gradient */}
          <linearGradient id="blue3dFront" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="30%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Blue Bevel / Extrusion Shadow Gradient */}
          <linearGradient id="blue3dExtrusion" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0B132B" />
          </linearGradient>

          {/* Blue Bright Highlight Edge */}
          <linearGradient id="blue3dHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Silver / Chrome Arc & Bars Front Face */}
          <linearGradient id="chrome3dFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E2E8F0" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Chrome Bevel Extrusion */}
          <linearGradient id="chrome3dExtrusion" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Deep Ambient Cast Shadow */}
          <filter id="ambientShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
          </filter>

          {/* Intense Blue Glow for Arrow & Dollar */}
          <filter id="neonBlueGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- 1. DARK BACKGROUND GLOW BASE --- */}
        <circle cx="60" cy="60" r="54" fill="#030712" opacity="0.6" />

        {/* --- 2. SILVER / CHROME ARC (TOP-RIGHT) --- */}
        <g filter="url(#ambientShadow)">
          {/* Chrome Arc 3D Extrusion (Shadow Base) */}
          <path
            d="M 64 12 C 86 12, 104 28, 106 52 C 107 60, 104 68, 98 76 L 91 70 C 95 64, 96 58, 95 52 C 93 33, 78 20, 60 20 Z"
            fill="url(#chrome3dExtrusion)"
          />
          {/* Chrome Arc Front Face */}
          <path
            d="M 62 10 C 85 10, 104 26, 105 50 C 106 58, 103 66, 97 74 L 91 68 C 95 62, 96 56, 95 50 C 93 31, 78 18, 60 18 Z"
            fill="url(#chrome3dFront)"
            stroke="#F8FAFC"
            strokeWidth="0.5"
          />
        </g>

        {/* --- 3. 3D BLUE CRESCENT RING (LEFT & BOTTOM SWEEP) --- */}
        <g filter="url(#ambientShadow)">
          {/* Blue Crescent Extrusion (Depth/Shadow layer) */}
          <path
            d="M 58 10 C 30 10, 8 32, 8 60 C 8 88, 28 108, 62 108 C 76 108, 88 102, 96 92 L 90 86 C 83 94, 73 98, 60 98 C 34 98, 18 80, 18 60 C 18 40, 34 20, 58 18 Z"
            fill="url(#blue3dExtrusion)"
          />
          {/* Blue Crescent Main Front Face */}
          <path
            d="M 56 8 C 28 8, 6 30, 6 58 C 6 86, 26 106, 60 106 C 74 106, 86 100, 94 90 L 88 84 C 81 92, 71 96, 58 96 C 32 96, 16 78, 16 58 C 16 38, 32 18, 56 16 Z"
            fill="url(#blue3dFront)"
          />
          {/* Metallic Inner Highlight Rim */}
          <path
            d="M 56 8 C 32 8, 12 26, 8 52 C 10 32, 28 14, 52 10 Z"
            fill="url(#blue3dHighlight)"
            opacity="0.9"
          />
        </g>

        {/* --- 4. 3D SILVER ASCENDING BAR CHART (BOTTOM RIGHT) --- */}
        <g filter="url(#ambientShadow)">
          {/* Bar 1 */}
          <path d="M 52 82 L 58 82 L 58 94 L 52 94 Z" fill="url(#chrome3dExtrusion)" />
          <path d="M 50 80 L 56 80 L 56 94 L 50 94 Z" fill="url(#chrome3dFront)" stroke="#FFFFFF" strokeWidth="0.3" />

          {/* Bar 2 */}
          <path d="M 62 74 L 68 74 L 68 94 L 62 94 Z" fill="url(#chrome3dExtrusion)" />
          <path d="M 60 72 L 66 72 L 66 94 L 60 94 Z" fill="url(#chrome3dFront)" stroke="#FFFFFF" strokeWidth="0.3" />

          {/* Bar 3 */}
          <path d="M 72 64 L 78 64 L 78 94 L 72 94 Z" fill="url(#chrome3dExtrusion)" />
          <path d="M 70 62 L 76 62 L 76 94 L 70 94 Z" fill="url(#chrome3dFront)" stroke="#FFFFFF" strokeWidth="0.3" />

          {/* Bar 4 */}
          <path d="M 82 52 L 88 52 L 88 94 L 82 94 Z" fill="url(#chrome3dExtrusion)" />
          <path d="M 80 50 L 86 50 L 86 94 L 80 94 Z" fill="url(#chrome3dFront)" stroke="#FFFFFF" strokeWidth="0.3" />
        </g>

        {/* --- 5. CENTRAL 3D METALLIC BLUE DOLLAR SIGN ($) --- */}
        <g filter="url(#neonBlueGlow)">
          {/* Deep Black/Navy Shadow Drop for 3D depth */}
          <text
            x="53"
            y="64"
            fill="#030712"
            fontSize="52"
            fontWeight="900"
            fontFamily="Arial Black, Impact, sans-serif"
            textAnchor="middle"
            dominantBaseline="central"
            opacity="0.9"
          >
            $
          </text>
          {/* Deep Blue Bevel Layer */}
          <text
            x="51"
            y="62"
            fill="url(#blue3dExtrusion)"
            fontSize="52"
            fontWeight="900"
            fontFamily="Arial Black, Impact, sans-serif"
            textAnchor="middle"
            dominantBaseline="central"
          >
            $
          </text>
          {/* Front Face Layer */}
          <text
            x="49"
            y="59"
            fill="url(#blue3dFront)"
            stroke="url(#blue3dHighlight)"
            strokeWidth="1.2"
            fontSize="52"
            fontWeight="900"
            fontFamily="Arial Black, Impact, sans-serif"
            textAnchor="middle"
            dominantBaseline="central"
          >
            $
          </text>
        </g>

        {/* --- 6. 3D DYNAMIC UPWARD BLUE ARROW --- */}
        <g filter="url(#neonBlueGlow)">
          {/* Arrow Tail & Swoop Shadow/Extrusion */}
          <path
            d="M 18 84 C 28 80, 48 72, 70 54 L 98 34 L 102 46 L 112 24 L 88 26 L 94 36 L 66 58 C 46 74, 28 82, 18 84 Z"
            fill="url(#blue3dExtrusion)"
            opacity="0.8"
          />

          {/* Arrow Tail Swoop (3D Metallic Blue Front) */}
          <path
            d="M 16 82 C 26 78, 46 70, 68 52 L 92 32"
            fill="none"
            stroke="url(#blue3dFront)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Arrow Tail Top Highlight Line */}
          <path
            d="M 16 80 C 26 76, 46 68, 68 50 L 92 30"
            fill="none"
            stroke="url(#blue3dHighlight)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 3D Arrowhead (Front Face) */}
          <path
            d="M 82 22 L 110 22 L 96 46 Z"
            fill="url(#blue3dFront)"
            stroke="url(#blue3dHighlight)"
            strokeWidth="1.5"
          />
          {/* Arrowhead Bevel Facet */}
          <path
            d="M 96 22 L 110 22 L 96 46 Z"
            fill="url(#blue3dHighlight)"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
};
