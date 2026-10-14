import { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(function Select(
  { label, error, helper, required = false, className = '', children, placeholder, ...rest },
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

      <select
        ref={ref}
        id={rest.id || rest.name}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:bg-slate-50 disabled:text-slate-500',
          error
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
            : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>

      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
      {!error && helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </div>
  );
});

export default Select;