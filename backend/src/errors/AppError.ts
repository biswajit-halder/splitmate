export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = new.target.name
    this.status = status
    this.code = code
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class ValidationError extends AppError {
  readonly details: Record<string, unknown> | undefined

  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}
