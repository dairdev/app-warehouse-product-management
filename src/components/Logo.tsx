import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'horizontal';
  theme?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  theme = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subtitleColor = theme === 'dark' ? 'text-yellow-400' : 'text-slate-500';

  const IconElement = (
    <svg
      viewBox="0 0 120 120"
      className={`${iconSizes[size]} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="120" rx="16" fill={theme === 'dark' ? '#1E293B' : '#FEF9C3'} />
      <path
        d="M 30 75 L 30 45 L 60 22 L 90 45 L 90 75 L 30 75 Z"
        stroke="#CA8A04"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 45 75 L 45 42 L 75 66 L 75 35"
        stroke="#EAB308"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{IconElement}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {IconElement}
        <div className="flex flex-col leading-none">
          <span className={`text-[10px] tracking-[0.2em] font-semibold uppercase ${subtitleColor}`}>
            Almacenes
          </span>
          <span className={`text-base font-extrabold tracking-tight ${textColor}`}>
            NOR ORIENTE
          </span>
        </div>
      </div>
    );
  }

  // Full stacked
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {IconElement}
      <div className="mt-2 leading-tight">
        <span className={`block text-[11px] tracking-[0.25em] font-bold uppercase ${subtitleColor}`}>
          Almacenes
        </span>
        <span className={`block text-xl font-extrabold tracking-tight ${textColor}`}>
          NOR ORIENTE
        </span>
      </div>
    </div>
  );
};
