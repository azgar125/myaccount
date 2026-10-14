import clsx from 'clsx';

export default function Card({
  children,
  className = '',
  padding = true,
  shadow = true,
  as: Component = 'div',
  ...rest
}) {
  return (
    <Component
      className={clsx(
        'bg-white rounded-xl border border-slate-200',
        shadow && 'shadow-card',
        padding && 'p-4 sm:p-5',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

/* ---- Sub-components ---- */

export function CardHeader({ title, subtitle, action, className = '', children }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        {title && (
          <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-slate-100', className)}>
      {children}
    </div>
  );
}