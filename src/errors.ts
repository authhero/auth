export class UnauthenticatedError extends Error {
  status = 401;

  constructor(message = "Unauthenticated") {
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

export class NoUserFoundError extends Error {
  status = 404;

  constructor(message = "No User Found") {
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
