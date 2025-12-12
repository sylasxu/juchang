import { useState } from 'react';
import type { ApiError } from '@/lib/api';

interface ErrorAlertProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorAlert({ error, onRetry, onDismiss, className = '' }: ErrorAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`bg-red-50 p-4 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            请求失败 (错误码: {error.code})
          </h3>
          <p className="mt-1 text-sm text-red-700">{error.msg}</p>
          {error.data && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">查看详细信息</summary>
              <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(error.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <div className="ml-4 flex space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-500 font-medium"
            >
              重试
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-sm text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}