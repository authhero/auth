export class NotFoundError extends Error {
  status = 404;
}

export class AuthError extends Error {
  status = 400;
}

export class InvalidRequestError extends Error {
  status = 400;
}

export class InvalidConnectionError extends InvalidRequestError {
  constructor(message = "Invalid Connection") {
    super();

    this.message = message;
  }
}

export class UnauthenticatedError extends Error {
  status = 401;

  constructor(message = "Unauthenticated") {
    super();

    this.message = message;
  }
}

export class UnauthorizedError extends Error {
  status = 403;

  constructor(message = "Unauthorized") {
    super();

    this.message = message;
  }
}

export class AuthenticationCodeExpiredError extends Error {
  status = 401;

  constructor(message = "Authentication code expired") {
    super();

    this.message = message;
  }
}

export class InvalidCodeError extends Error {
  status = 401;

  constructor(message = "Invalid code") {
    super();

    this.message = message;
  }
}

export class NoCodeError extends Error {
  status = 401;

  constructor(message = "No code found") {
    super();

    this.message = message;
  }
}

export class NoUserFoundError extends Error {
  status = 404;

  constructor(message = "No user found") {
    super();

    this.message = message;
  }
}

export class UserConflictError extends Error {
  status = 404;

  constructor(message = "User Alredy Exists") {
    super();

    this.message = message;
  }
}

export class InvalidCodeVerifierError extends AuthError {
  constructor(message = "Invalid Code Verifier") {
    super();

    this.message = message;
  }
}

export class InvalidClientError extends AuthError {
  constructor(message = "Invalid Client") {
    super();

    this.message = message;
  }
}
