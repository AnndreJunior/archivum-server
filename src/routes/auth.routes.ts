import { Router } from 'express'
import * as authController from '@src/controllers/auth.controller'

const authRouter = Router()

authRouter.post('/login', authController.login)

export { authRouter }
