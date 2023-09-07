export class NotFoundError extends Error {
  constructor(message = "Not Found") {
    super();

    this.message = message;
  }

  status = 404;
}

export class ConflictError extends Error {
  status = 409;
}

export class AuthError extends Error {
  status = 400;
}

export class InvalidRequestError extends Error {
  status = 400;
}

export class InvalidRedirectError extends InvalidRequestError {
  constructor(message = "Invalid Redirect Uri") {
    super();

    this.message = message;
  }
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

export class ExpiredTokenError extends UnauthorizedError {
  constructor(message = "Token Expired") {
    super();

    this.message = message;
  }
}

export class InvalidScopesError extends UnauthorizedError {
  constructor(message = "Invalid Scopes") {
    super();

    this.message = message;
  }
}

export class InvalidSignatureError extends UnauthorizedError {
  constructor(message = "Invalid Signature") {
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

  constructor(message = "User Already Exists") {
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
