# API do Archivum

Documentação dos endpoints HTTP expostos pelo Archivum Server.

## Convenções

- Rotas autenticadas esperam o header `Authorization: Bearer <token>`.

### Formato padrão de erro

Todos os erros seguem o mesmo envelope:

```json
{
  "statusCode": 400,
  "code": "VALIDATION",
  "message": "Um ou mais campos estão inválidos.",
  "details": {
    "email": ["E-mail com formato inválido."]
  },
  "instance": "/auth/login",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

| Campo        | Tipo   | Descrição                                                 |
| ------------ | ------ | --------------------------------------------------------- |
| `statusCode` | number | Código HTTP da resposta                                   |
| `code`       | string | Identificador do erro (ver tabela abaixo)                 |
| `message`    | string | Mensagem legível para o cliente                           |
| `details`    | object | Dados adicionais do erro; campo **ausente** quando não há |
| `instance`   | string | Caminho da requisição que originou o erro                 |
| `timestamp`  | string | Momento do erro, em ISO 8601 UTC                          |

### Códigos de erro

| `code`                  | HTTP  | Quando ocorre                                               |
| ----------------------- | ----- | ----------------------------------------------------------- |
| `VALIDATION`            | `400` | Falha na validação do corpo da requisição                   |
| `UNAUTHORIZED`          | `401` | Credenciais inválidas                                       |
| `FORBIDDEN`             | `403` | Autenticação válida, mas ação não permitida no estado atual |
| `NOT_FOUND`             | `404` | Recurso não encontrado                                      |
| `CONFLICT`              | `409` | Recurso já existente / violação de unicidade                |
| `UNPROCESSABLE_ENTITY`  | `422` | Requisição válida, mas impossível de processar              |
| `INTERNAL_SERVER_ERROR` | `500` | Erro inesperado (detalhes não são expostos ao cliente)      |

## Endpoints

### 1. Health Check

#### `GET /healthz`

Verifica se a aplicação está no ar.

- **Autenticação:** não exige
- **Resposta:** `200 OK` com o texto `Healthy` (`Content-Type: text/plain`)

### 2. Autenticação

#### `POST /auth/login`

Primeira etapa do login do bibliotecário. Valida e-mail e senha e, quando a
autenticação de dois fatores (2FA) está habilitada, retorna um token temporário
para concluir o fluxo. Quando o 2FA ainda não foi configurado, a requisição é
recusada com `403` e um token de configuração é devolvido.

- **Autenticação:** não exige
- **Body:** `application/json`

| Campo      | Tipo   | Obrigatório | Descrição                                   |
| ---------- | ------ | ----------- | ------------------------------------------- |
| `email`    | string | sim         | E-mail do bibliotecário, com formato válido |
| `password` | string | sim         | Senha do bibliotecário                      |

**Respostas**

`200 OK` — credenciais válidas e 2FA habilitado:

```json
{
  "require2fa": true,
  "token2fa": "<token>"
}
```

O `token2fa` é válido por 5 minutos.

`400 Bad Request` — payload inválido:

```json
{
  "statusCode": 400,
  "code": "VALIDATION",
  "message": "Um ou mais campos estão inválidos.",
  "details": {
    "email": ["E-mail com formato inválido."],
    "password": ["Informe sua senha."]
  },
  "instance": "/auth/login",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

`401 Unauthorized` — credenciais inválidas (mesma mensagem para e-mail
inexistente e senha incorreta):

```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "E-mail ou senha inválidos.",
  "instance": "/auth/login",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

`403 Forbidden` — 2FA não habilitado. As credenciais estão corretas, mas o
bibliotecário ainda não configurou a autenticação de dois fatores; nesse caso
`details.token` é um token para configurar a autenticação de dois fatores,
válido por 5 minutos:

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "Autenticação de dois fatores não habilitada.",
  "details": {
    "token": "<token>"
  },
  "instance": "/auth/login",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```
