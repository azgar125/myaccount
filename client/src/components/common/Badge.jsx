import clsx from 'clsx';

const toneMap = {
  // Generic
  default:   'bg-slate-100 text-slate-700',
  primary:   'bg-primary-100 text-primary-700',
  success:   'bg-success-50 text-success-700',
  danger:    'bg-danger-50 text-danger-700',
  warning:   'bg-warning-50 text-warning-700',
  info:      'bg-sky-100 text-sky-700',

  // Statuses (auto-mapped)
  ACTIVE:    'bg-success-50 text-success-700',
  INACTIVE:  'bg-slate-100 text-slate-600',
  SUSPENDED: 'bg-danger-50 text-danger-700',
  BLOCKED:   'bg-danger-50 text-danger-700',

  PENDING:   'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-success-50 text-success-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  FAILED:    'bg-danger-50 text-danger-700',

  // Transaction types
  RECEIVE:    'bg-success-50 text-success-700',
  PAYMENT:    'bg-warning-50 text-warning-700',
  TRANSFER:   'bg-sky-100 text-sky-700',
  ADJUSTMENT: 'bg-purple-100 text-purple-700',

  // User roles
  ADMIN:  'bg-primary-100 text-primary-700',
  CLIENT: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, tone = 'default', className = '' }) {
  const classes = toneMap[tone] || toneMap.default;

  return (
    <span className={clsx('badge', classes, className)}>
      {children}
    </span>
  );
}