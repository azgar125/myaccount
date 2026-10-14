import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-primary-500',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  success:   'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
  warning:   'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
  ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
  link:      'text-primary-600 hover:underline focus:ring-0 p-0',
};

const sizes = {
  xs: 'text-xs px-2 py-1 rounded-md gap-1',
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-base px-5 py-2.5 rounded-lg gap-2',
  icon: 'p-2 rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  fullWidth = false,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'xs' || size === 'sm' ? 14 : 16} />
      )}

      {children}

      {!loading && IconRight && (
        <IconRight size={size === 'xs' || size === 'sm' ? 14 : 16} />
      )}
    </button>
  );
}