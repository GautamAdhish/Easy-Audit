import Vendor from "../models/Vendor.js";
import createCRUDController from "./crudControllerFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

const base = createCRUDController(Vendor, {
  codePrefix: "V",
  searchFields: ["vendorName", "serviceDescription", "country", "notes"],
  populate: [{ path: "businessOwner", select: "name email role" }],
});

// Overridden (rather than using the factory's findByIdAndUpdate) so the
// residualRisk pre-validate hook — which only runs on .save() — recomputes
// whenever inherentRisk or controlEffectiveness change. Same pattern as
// riskController.updateOne.
const updateOne = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor)
    return next(new AppError(`Vendor not found with id ${req.params.id}`, 404));
  Object.assign(vendor, req.body);
  delete vendor.code;
  await vendor.save();
  const populated = await Vendor.findById(vendor._id).populate({
    path: "businessOwner",
    select: "name email role",
  });
  res.status(200).json({ success: true, data: populated });
});

export default { ...base, updateOne };
