import React from 'react';

interface MDSLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
}

export const MDSLogo: React.FC<MDSLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md',
  showBackground = false,
}) => {
  const sizeMap = {
    xs: { emblem: 'w-6 h-6', text: 'text-[10px]', subText: 'text-[11px]' },
    sm: { emblem: 'w-8 h-8', text: 'text-xs', subText: 'text-xs font-bold' },
    md: { emblem: 'w-10 h-10', text: 'text-[11px]', subText: 'text-sm font-extrabold' },
    lg: { emblem: 'w-14 h-14', text: 'text-sm', subText: 'text-base font-extrabold' },
    xl: { emblem: 'w-24 h-24', text: 'text-lg', subText: 'text-xl font-black' },
  };

  const EmblemSVG = (
    <svg
      viewBox="0 0 160 160"
      className={`${sizeMap[size].emblem} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cercle / Anneau Rouge */}
      <circle
        cx="80"
        cy="80"
        r="54"
        stroke="#E52320"
        strokeWidth="13"
        strokeLinecap="round"
      />

      {/* Caducée Médical Cyan (#00B0FF) */}
      <g id="mds-caducee" fill="#00B0FF" stroke="#00B0FF">
        {/* Tige centrale */}
        <line
          x1="80"
          y1="34"
          x2="80"
          y2="126"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Sphère sommitale */}
        <circle cx="80" cy="32" r="6" strokeWidth="1.5" />
        {/* Pointe inférieure */}
        <circle cx="80" cy="126" r="3" />

        {/* Ailes déployées stylisées */}
        <path
          d="M 77 47 C 62 36, 28 37, 10 52 C 28 64, 50 61, 65 56 C 45 67, 30 75, 23 83 C 38 82, 57 76, 77 66 Z"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M 83 47 C 98 36, 132 37, 150 52 C 132 64, 110 61, 95 56 C 115 67, 130 75, 137 83 C 122 82, 103 76, 83 66 Z"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Serpents entrelacés en double hélice */}
        <path
          d="M 73 54 C 66 61, 66 70, 80 78 C 94 86, 94 96, 80 104 C 66 112, 66 120, 80 126"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 87 54 C 94 61, 94 70, 80 78 C 66 86, 66 96, 80 104 C 94 112, 94 120, 80 126"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );

  if (variant === 'emblem') {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${
          showBackground ? 'bg-[#1B365D] p-2 rounded-2xl shadow-md' : ''
        } ${className}`}
      >
        {EmblemSVG}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center ${
          showBackground ? 'bg-[#1B365D] p-6 rounded-3xl shadow-xl' : ''
        } ${className}`}
      >
        <div className="relative mb-2.5">{EmblemSVG}</div>
        <span className="text-[#E52320] font-extrabold uppercase tracking-wide text-xs">
          Centre Médical
        </span>
        <span className="text-[#00B0FF] font-black tracking-tight text-base sm:text-lg">
          La Main du Secours
        </span>
      </div>
    );
  }

  // Variant 'horizontal'
  return (
    <div
      className={`inline-flex items-center gap-2.5 ${
        showBackground ? 'bg-[#1B365D] px-3 py-2 rounded-2xl shadow-md' : ''
      } ${className}`}
    >
      <div className="relative shrink-0">{EmblemSVG}</div>
      <div className="flex flex-col text-left leading-tight overflow-hidden">
        <span className="text-[#E52320] font-bold uppercase tracking-wider text-[10px]">
          Centre Médical
        </span>
        <span className="text-[#00B0FF] font-black tracking-tight text-xs sm:text-sm whitespace-nowrap">
          La Main du Secours
        </span>
      </div>
    </div>
  );
};
