import { errorHandler, AppError } from './errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = { path: '/test' };
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock })) as any;
    res = { status: statusMock };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set status and return error JSON for AppError', () => {
    const err: AppError = { name: 'TestError', message: 'Something went wrong', statusCode: 400 };
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
