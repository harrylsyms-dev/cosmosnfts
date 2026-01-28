import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      hint,
      hideLabel = false,
      leftAddon,
      rightAddon,
      id: providedId,
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const hasError = !!error;
    const describedBy = [
      hint ? hintId : null,
      hasError ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-gray-300 mb-1 ${
            hideLabel ? 'sr-only' : ''
          }`}
        >
          {label}
          {required && (
            <span className="text-red-400 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {hint && !hasError && (
          <p id={hintId} className="text-sm text-gray-500 mb-2">
            {hint}
          </p>
        )}

        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-gray-700 text-gray-400 sm:text-sm">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            className={`
              block w-full px-3 py-2
              bg-gray-800 border text-white
              placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftAddon ? 'rounded-l-none' : 'rounded-l-lg'}
              ${rightAddon ? 'rounded-r-none' : 'rounded-r-lg'}
              ${
                hasError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
              }
              ${className}
            `}
            {...props}
          />

          {rightAddon && (
            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-600 bg-gray-700 text-gray-400 sm:text-sm">
              {rightAddon}
            </span>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-sm text-red-400 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
