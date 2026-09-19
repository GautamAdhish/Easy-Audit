import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import APIFeatures from "../utils/apiFeatures.js";
import generateCode from "../utils/generateCode.js";

// GET /api/users
export const getAll = asyncHandler(async (req, res) => {
  const featureQuery = new APIFeatures(User.find(), req.query, [
    "name",
    "email",
    "department",
  ])
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const [results, total] = await Promise.all([
    featureQuery.query.populate("auditsAssigned"),
    User.countDocuments(featureQuery.query.getFilter()),
  ]);

  res.status(200).json({
    success: true,
    count: results.length,
    total,
    page: featureQuery.pagination.page,
    pages: Math.ceil(total / featureQuery.pagination.limit),
    data: results,
  });
});

// GET /api/users/:id
export const getOne = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("auditsAssigned");
  if (!user)
    return next(new AppError(`User not found with id ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: user });
});

// POST /api/users  (Admin only — see routes)
export const createOne = asyncHandler(async (req, res) => {
  const code = await generateCode("U");
  const user = await User.create({ ...req.body, code });
  res.status(201).json({ success: true, data: user });
});

// PATCH /api/users/:id  (Admin only, or self — see routes)
export const updateOne = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  delete payload.code;
  delete payload.password; // password changes go through a dedicated flow, not a plain PATCH

  const user = await User.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!user)
    return next(new AppError(`User not found with id ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: user });
});

// DELETE /api/users/:id  (Admin only — see routes)
export const deleteOne = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user)
    return next(new AppError(`User not found with id ${req.params.id}`, 404));
  res.status(204).json({ success: true, data: null });
});
