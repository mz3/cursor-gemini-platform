import {
  errorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from './errorHandler';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

describe('errorHandler middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      body: {},
      query: {},
      params: {},
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'test-agent';
        return undefined;
      }) as any
    };
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock })) as any;
    res = { status: statusMock };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle ValidationError correctly', () => {
    const err = new ValidationError('Validation failed', [{ field: 'email', message: 'Invalid email' }]);
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Please check your input and try again',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle AuthenticationError correctly', () => {
    const err = new AuthenticationError('Invalid token');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Invalid token',
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle NotFoundError correctly', () => {
    const err = new NotFoundError('User');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'User not found',
        statusCode: 404,
        code: 'NOT_FOUND',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle ConflictError correctly', () => {
    const err = new ConflictError('User already exists');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'User already exists',
        statusCode: 409,
        code: 'CONFLICT',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle DatabaseError correctly', () => {
    const err = new DatabaseError('Connection failed');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'An unexpected error occurred. Please try again later',
        statusCode: 500,
        code: 'DATABASE_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle JWT TokenExpiredError correctly', () => {
    const err = new jwt.TokenExpiredError('Token expired', new Date());
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Your session has expired. Please log in again',
        statusCode: 401,
        code: 'UNKNOWN_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle JWT JsonWebTokenError correctly', () => {
    const err = new jwt.JsonWebTokenError('Invalid token');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Your session has expired. Please log in again',
        statusCode: 401,
        code: 'UNKNOWN_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should handle TypeError with property access correctly', () => {
    const err = new TypeError('Cannot read property \'id\' of undefined');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'An unexpected error occurred. Please try again',
        statusCode: 500,
        code: 'UNKNOWN_ERROR',
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should include validation errors in response when available', () => {
    const validationErrors = [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password too short' }
    ];
    const err = new ValidationError('Validation failed', validationErrors);
    errorHandler(err, req as Request, res as Response, next);

    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        validationErrors: validationErrors
      })
    });
  });

  it('should include development details when NODE_ENV is development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new ValidationError('Test error', [{ field: 'test', message: 'Test message' }]);
    errorHandler(err, req as Request, res as Response, next);

    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        details: expect.objectContaining({
          originalMessage: 'Test error',
          stack: expect.any(String),
          details: [{ field: 'test', message: 'Test message' }]
        })
      })
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include development details when NODE_ENV is production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new ValidationError('Test error');
    errorHandler(err, req as Request, res as Response, next);

    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.not.objectContaining({
        details: expect.any(Object)
      })
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should log error details correctly', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const err = new ValidationError('Test error');

    errorHandler(err, req as Request, res as Response, next);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] Error 400:/),
      expect.objectContaining({
        name: 'ValidationError',
        message: 'Validation failed',
        path: '/test',
        method: 'GET',
        userAgent: 'test-agent',
        ip: '127.0.0.1'
      })
    );
  });

  it('should handle generic AppError correctly', () => {
    const err: AppError = {
      name: 'TestError',
      message: 'Something went wrong',
      statusCode: 400
    };
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Something went wrong',
        statusCode: 400,
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });

  it('should default to 500 and generic message if not provided', () => {
    const err: AppError = { name: 'TestError', message: '' };
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.objectContaining({
        message: 'Internal Server Error',
        statusCode: 500,
        path: '/test',
        timestamp: expect.any(String)
      })
    });
  });
});
