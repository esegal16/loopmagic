import { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-sm',
    };

    const classes = [
      'inline-flex items-center font-medium rounded-full',
      variants[variant],
      sizes[size],
      className,
    ].join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

// Specialized badge for recommendations — warm palette solid fill
export interface RecommendationBadgeProps {
  verdict: 'pursue' | 'watch' | 'pass';
  size?: 'sm' | 'md' | 'lg';
}

export function RecommendationBadge({ verdict, size = 'md' }: RecommendationBadgeProps) {
  const config = {
    pursue: { label: 'PURSUE', bg: 'bg-lm-green', text: 'text-white' },
    watch: { label: 'WATCH', bg: 'bg-lm-amber', text: 'text-white' },
    pass: { label: 'PASS', bg: 'bg-lm-red', text: 'text-white' },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-[11px]',
    lg: 'px-3.5 py-1.5 text-xs',
  };

  const { label, bg, text } = config[verdict];

  return (
    <span
      className={`inline-flex items-center font-heading font-bold tracking-wide ${bg} ${text} ${sizes[size]}`}
    >
      {label}
    </span>
  );
}
