import { ForbiddenError, UnauthorizedError } from './app-error'

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('E-mail ou senha inválidos.')
  }
}

export class TwoFactorSetupRequiredError extends ForbiddenError {
  constructor(token: string) {
    super('Autenticação de dois fatores não habilitada.', {
      token,
    })
  }
}
