import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initials = alt.slice(0, 2).toUpperCase();

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
    />
  );
}