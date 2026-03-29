export default function DiscussLogo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <span className={`font-heading font-bold italic ${sizes[size]} ${className}`}>
      <span className="text-[#3B82F6]">&lt;</span>
      <span className="text-[#CC0000]">discuss</span>
      <span className="text-[#3B82F6]">&gt;</span>
    </span>
  );
}
