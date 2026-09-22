import { StatusCodes } from 'http-status-codes'

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown, code: string = 'BAD_REQUEST') {
    super(StatusCodes.BAD_REQUEST, code, message, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: unknown, code: string = 'UNAUTHORIZED') {
    super(StatusCodes.UNAUTHORIZED, code, message, details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown, code: string = 'FORBIDDEN') {
    super(StatusCodes.FORBIDDEN, code, message, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown, code: string = 'NOT_FOUND') {
    super(StatusCodes.NOT_FOUND, code, message, details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown, code: string = 'CONFLICT') {
    super(StatusCodes.CONFLICT, code, message, details)
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(
    message: string,
    details?: unknown,
    code: string = 'UNPROCESSABLE_ENTITY',
  ) {
    super(StatusCodes.UNPROCESSABLE_ENTITY, code, message, details)
  }
}
