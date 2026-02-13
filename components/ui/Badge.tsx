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

// Specialized badge for recommendations
export interface RecommendationBadgeProps {
  verdict: 'buy' | 'pass' | 'negotiate';
  size?: 'sm' | 'md' | 'lg';
}

export function RecommendationBadge({ verdict, size = 'md' }: RecommendationBadgeProps) {
  const config = {
    buy: { label: 'BUY', variant: 'success' as const },
    pass: { label: 'PASS', variant: 'danger' as const },
    negotiate: { label: 'NEGOTIATE', variant: 'warning' as const },
  };

  const { label, variant } = config[verdict];

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
