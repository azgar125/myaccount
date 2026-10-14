import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input(
  { label, error, helper, icon: Icon = null, required = false, className = '', ...rest },
  ref
) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={rest.id || rest.name} className="label">
          {label}
          {required && <span className="text-danger-600 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}

        <input
          ref={ref}
          id={rest.id || rest.name}
          className={clsx(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-slate-50 disabled:text-slate-500',
            Icon && 'pl-9',
            error
              ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
              : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500',
            rest.type === 'number' && '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
          {...rest}
        />
      </div>

      {error && (
        <p className="text-xs text-danger-600 mt-1">{error}</p>
      )}
      {!error && helper && (
        <p className="text-xs text-slate-500 mt-1">{helper}</p>
      )}
    </div>
  );
});

export default Input;