import Risk from "../models/Risk.js";
import createCRUDController from "./crudControllerFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const base = createCRUDController(Risk, {
  codePrefix: "R",
  searchFields: ["title", "category", "mitigationPlan"],
  populate: [{ path: "owner", select: "name email role" }],
});

const updateOne = asyncHandler(async (req, res, next) => {
  const risk = await Risk.findById(req.params.id);
  if (!risk)
    return next(new AppError(`Risk not found with id ${req.params.id}`, 404));
  Object.assign(risk, req.body);
  delete risk.code;
  await risk.save();
  const populated = await Risk.findById(risk._id).populate({
    path: "owner",
    select: "name email role",
  });
  res.status(200).json({ success: true, data: populated });
});

export default { ...base, updateOne };
