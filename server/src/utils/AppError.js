/**
 * Operational error type. Anything thrown as AppError is a known,
 * expected failure (bad input, missing resource, auth failure) as opposed
 * to a programming bug, so the global error handler can safely expose
 * its message to the client.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
