import { ForbiddenError, UnauthorizedError } from './app-error'

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Token inválido ou expirado.')
  }
}

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

export class InvalidTwoFactorCodeError extends UnauthorizedError {
  constructor() {
    super('Código de verificação inválido.')
  }
}
