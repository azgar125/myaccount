import { Inbox } from 'lucide-react';
import clsx from 'clsx';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data',
  message,
  action,
  className = '',
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon size={26} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>

      {message && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}