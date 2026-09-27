import type { Request, Response } from 'express'
import { loginSchema } from '@src/schemas/auth'
import * as authService from '@src/services/auth.service'
import { StatusCodes } from 'http-status-codes'

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body)
  const { token: token2fa } = await authService.login(body)
  return res.status(StatusCodes.OK).json({
    require2fa: true,
    token2fa,
  })
}
