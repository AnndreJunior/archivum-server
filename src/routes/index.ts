import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'

const router = Router()

router.get('/healthz', (_, res) => res.status(StatusCodes.OK).send('Healthy'))

export { router }
