import pinoHttp from 'pino-http'
import { logger } from '@src/utils/logger'
import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'

export const httpLoggerMiddleware = pinoHttp<Request, Response>({
  logger,
  genReqId: (req, res) => {
    const existingId = req.id ?? req.headers['x-request-id']
    if (existingId) return existingId as string

    const id = randomUUID()
    res.setHeader('X-Request-Id', id)
    return id
  },
  autoLogging: {
    ignore: (req) => req.url === '/healthz' || req.url === '/metrics',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      userAgent: req.headers['user-agent'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },

  customLogLevel: (_, res) => {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn'
    if (res.statusCode >= 500) return 'error'
    return 'info'
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return `${req.method} ${req.url} - Resource not found`
    }
    return `${req.method} ${req.url} completed with status ${res.statusCode}`
  },
  customErrorMessage: function (req, res) {
    return `${req.method} ${req.url} errored with status ${res.statusCode}`
  },
})
