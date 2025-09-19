'use client';

import clsx from 'classnames';

interface StatusMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={clsx(
        'rounded-md border px-4 py-3 text-sm',
        type === 'success' && 'border-green-200 bg-green-50 text-green-800',
        type === 'error' && 'border-red-200 bg-red-50 text-red-700',
        type === 'info' && 'border-blue-200 bg-blue-50 text-blue-700',
      )}
    >
      {message}
    </div>
  );
}
