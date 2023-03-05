export class UnauthenticatedError extends Error {
  status = 401;

  constructor(message = "Unauthenticated") {
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
