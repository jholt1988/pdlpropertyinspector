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

       <img src='/image_119_100.png' style={{width:'119px', height:'100px'}} />
    </div>
          )}