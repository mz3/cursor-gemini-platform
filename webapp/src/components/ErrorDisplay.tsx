import React from 'react';
import { AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export interface ErrorDisplayProps {
  error: string | null;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = 'error',
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const getErrorStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-400',
          iconComponent: AlertTriangle
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-400',
          iconComponent: Info
        };
      default: // error
        return {
          container: 'bg-red-50 border-red-200 text-red-700',
          icon: 'text-red-400',
          iconComponent: AlertCircle
        };
    }
  };

  const styles = getErrorStyles();
  const IconComponent = styles.iconComponent;

  return (
    <div className={`border rounded-md p-4 ${styles.container} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{error}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${styles.container} hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-50 focus:ring-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-600`}
              >
                <span className="sr-only">Dismiss</span>
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
