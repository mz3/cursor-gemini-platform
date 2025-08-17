// Error handling utilities for the webapp

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
  isAuthError?: boolean;
  isValidationError?: boolean;
  isNetworkError?: boolean;
  validationErrors?: any[];
}

/**
 * Formats an error message for display to users
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Checks if an error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error?.isAuthError || error?.status === 401 || error?.response?.status === 401;
};

/**
 * Checks if an error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  return error?.isValidationError || error?.status === 400 || error?.response?.status === 400;
};

/**
 * Checks if an error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return error?.isNetworkError || !error?.response;
};

/**
 * Gets validation errors from an API error response
 */
export const getValidationErrors = (error: any): any[] => {
  if (error?.validationErrors) {
    return error.validationErrors;
  }

  if (error?.response?.data?.error?.validationErrors) {
    return error.response.data.error.validationErrors;
  }

  return [];
};

/**
 * Creates a user-friendly error message based on error type
 */
export const createUserFriendlyError = (error: any): string => {
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }

  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (isValidationError(error)) {
    const validationErrors = getValidationErrors(error);
    if (validationErrors.length > 0) {
      return `Please fix the following errors: ${validationErrors.map(e => e.message || e).join(', ')}`;
    }
    return 'Please check your input and try again.';
  }

  return formatErrorMessage(error);
};

/**
 * Logs an error with additional context
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    message: formatErrorMessage(error),
    status: error?.status || error?.response?.status,
    code: error?.code || error?.response?.data?.error?.code,
    context,
    timestamp: new Date().toISOString(),
    stack: error?.stack,
    data: error?.data || error?.response?.data
  };

  console.error('Application Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
};

/**
 * Handles common error scenarios and returns appropriate user feedback
 */
export const handleError = (error: any, context?: string): ApiError => {
  logError(error, context);

  return {
    message: createUserFriendlyError(error),
    status: error?.status || error?.response?.status,
    code: error?.code || error?.response?.data?.error?.code,
    data: error?.data || error?.response?.data,
    isAuthError: isAuthError(error),
    isValidationError: isValidationError(error),
    isNetworkError: isNetworkError(error),
    validationErrors: getValidationErrors(error)
  };
};
