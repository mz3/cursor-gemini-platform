import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

// Custom error classes for better error handling
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error implements AppError {
  statusCode = 500;
  isOperational = false;
  code = 'DATABASE_ERROR';

  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  const isOperational = err.isOperational !== false; // Default to true for custom errors

  // Determine the error message
  let message = err.message;
  let userMessage = err.message;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    message = 'Validation failed';
    userMessage = 'Please check your input and try again';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    userMessage = 'Your session has expired. Please log in again';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    userMessage = 'Your session has expired. Please log in again';
  } else if (err.name === 'CastError') {
    message = 'Invalid ID format';
    userMessage = 'The requested resource was not found';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if ((err as any).code === 11000) {
      message = 'Duplicate key error';
      userMessage = 'This resource already exists';
    } else {
      message = 'Database error';
      userMessage = 'A database error occurred. Please try again later';
    }
  } else if (err.name === 'TypeError' && err.message.includes('Cannot read property')) {
    message = 'Property access error';
    userMessage = 'An unexpected error occurred. Please try again';
  } else if (!isOperational) {
    // For non-operational errors, use generic message
    userMessage = 'An unexpected error occurred. Please try again later';
  }

  // Handle empty messages
  if (!userMessage || userMessage.trim() === '') {
    userMessage = 'Internal Server Error';
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] Error ${statusCode}:`, {
    name: err.name,
    message: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id || 'anonymous',
    body: req.body,
    query: req.query,
    params: req.params
  });

  // In development, include more details
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: any = {
    error: {
      message: isDevelopment ? message : userMessage,
      statusCode,
      code: err.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  // Include additional details in development
  if (isDevelopment) {
    errorResponse.error.details = {
      originalMessage: err.message,
      stack: err.stack,
      details: err.details
    };
  }

  // Include validation details if available
  if (err.details && Array.isArray(err.details)) {
    errorResponse.error.validationErrors = err.details;
  }

  res.status(statusCode).json(errorResponse);
};
