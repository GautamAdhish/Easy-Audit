import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

/**
 * Verifies the Bearer JWT on the request, loads the corresponding user,
 * and attaches it to req.user. Blocks the request (401) if the token is
 * missing, invalid, expired, or the user account was deactivated or
 * deleted after the token was issued.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401),
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(
      new AppError("Invalid or expired session. Please log in again.", 401),
    );
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this session no longer exists.", 401),
    );
  }
  if (currentUser.status !== "Active") {
    return next(new AppError("This account has been deactivated.", 401));
  }

  req.user = currentUser;
  next();
});

/**
 * Restricts a route to a fixed set of roles. Must be used after `protect`.
 * Usage: router.delete('/:id', protect, restrictTo('Admin'), controller.remove)
 */
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403),
      );
    }
    next();
  };

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
