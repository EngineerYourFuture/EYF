export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found.`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied.") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "VALIDATION", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = "UNAUTHORIZED", message = "Authentication required.") {
    super(401, code, message);
  }
}

export class LockedError extends AppError {
  constructor(message: string) {
    super(423, "ACCOUNT_LOCKED", message);
  }
}
