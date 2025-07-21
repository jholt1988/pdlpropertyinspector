interface KeyCheckLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function KeyCheckLogo({ size = 'md', className = '' }: KeyCheckLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Circular background with gradient */}
        <defs>
          <linearGradient id="keyCheckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9DB5A6" />
            <stop offset="100%" stopColor="#5A6B5D" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="url(#keyCheckGradient)" stroke="#2D3E30" strokeWidth="2"/>
        
        {/* Keyhole shape */}
        <g transform="translate(50, 50)">
          {/* Key circle */}
          <circle cx="0" cy="-8" r="12" fill="none" stroke="#2D3E30" strokeWidth="2.5"/>
          
          {/* Key shaft */}
          <rect x="-3" y="4" width="6" height="20" fill="none" stroke="#2D3E30" strokeWidth="2.5" rx="1"/>
          
          {/* Key teeth */}
          <rect x="3" y="16" width="4" height="3" fill="none" stroke="#2D3E30" strokeWidth="1.5"/>
          <rect x="3" y="20" width="6" height="2" fill="none" stroke="#2D3E30" strokeWidth="1.5"/>
        </g>
      </svg>
    </div>
  );
}