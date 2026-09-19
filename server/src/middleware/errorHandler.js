import AppError from "../utils/AppError.js";

/**
 * Translates known Mongoose/JWT error types into clean AppErrors so the
 * client always gets a consistent { success, message } shape instead of
 * a raw stack trace or a driver-specific error object.
 */
const handleCastErrorDB = (err) =>
  new AppError(`Invalid value "${err.value}" for field "${err.path}"`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : "";
  return new AppError(
    `Duplicate value for "${field}": "${value}" already exists.`,
    409,
  );
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input: ${messages.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid session token. Please log in again.", 401);
const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, name: err.name };

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const isOperational = error.isOperational || false;

  if (!isOperational) {
    // Unexpected/programming error — log full detail server-side, but
    // never leak internals (stack traces, driver messages) to the client.
    console.error("UNEXPECTED ERROR 💥", err);
  }

  res.status(statusCode).json({
    success: false,
    status,
    message: isOperational
      ? error.message
      : "Something went wrong on the server.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
