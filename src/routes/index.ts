import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import { authRouter } from './auth.routes'

const router = Router()

router.get('/healthz', (_, res) => res.status(StatusCodes.OK).send('Healthy'))

router.use('/auth', authRouter)

export { router }
