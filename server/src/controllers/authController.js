import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { signToken } from "../middleware/auth.js";
import generateCode from "../utils/generateCode.js";

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !department) {
    return next(
      new AppError("name, email, password and department are required.", 400),
    );
  }

  const code = await generateCode("U");
  const user = await User.create({
    code,
    name,
    email,
    password,
    role,
    department,
  });

  sendAuthResponse(user, 201, res);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }
  if (user.status !== "Active") {
    return next(new AppError("This account has been deactivated.", 401));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, 200, res);
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
