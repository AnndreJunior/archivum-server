import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { router } from './routes'
import { corsOptions } from './config/cors'

export function buildApp() {
  const app = express()

  app.use(express.json())
  app.use(helmet())
  app.use(cors(corsOptions))

  app.use(router)

  return app
}
