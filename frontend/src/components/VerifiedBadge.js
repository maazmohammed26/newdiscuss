import { CheckCircle } from 'lucide-react';

export default function VerifiedBadge({ size = 'sm', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <CheckCircle 
      className={`${sizes[size]} text-[#E63946] fill-[#E63946] inline-block ${className}`}
      strokeWidth={2.5}
    />
  );
}
