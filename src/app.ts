import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { router } from './routes'
import { corsOptions } from './config/cors'
import { httpLoggerMiddleware } from './middlewares/http-logger.middleware'

export function buildApp() {
  const app = express()

  app.use(express.json())
  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(httpLoggerMiddleware)

  app.use(router)

  return app
}
