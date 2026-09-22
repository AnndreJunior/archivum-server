import { AppError } from '@src/errors/app-error'
import { logger } from '@src/utils/logger'
import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ZodError } from 'zod'

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err)
  }

  const timestamp = new Date().toISOString()
  const instance = req.url

  if (err instanceof ZodError) {
    const details = err.issues.reduce<Record<string, string[]>>(
      (acc, { path, message }) => {
        const field = path.join('.')
        acc[field] = acc[field] || []
        acc[field].push(message)
        return acc
      },
      {},
    )

    return res.status(StatusCodes.BAD_REQUEST).json({
      statusCode: StatusCodes.BAD_REQUEST,
      code: 'VALIDATION',
      message: 'Um ou mais campos estão inválidos.',
      details,
      instance,
      timestamp,
    })
  }

  if (err instanceof AppError) {
    const { statusCode, code, message, details } = err
    return res.status(statusCode).json({
      statusCode,
      code,
      message,
      details,
      timestamp,
      instance,
    })
  }

  logger.error(err, 'Unexpected error')

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    instance,
    timestamp,
  })
}
