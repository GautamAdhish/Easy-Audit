import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import APIFeatures from "../utils/apiFeatures.js";
import generateCode from "../utils/generateCode.js";

/**
 * Factory that produces the standard getAll/getOne/create/update/remove
 * handlers for a Mongoose model. Every resource in this API (audits,
 * findings, capas, risks, evidence, checklist items, reports) follows
 * the same shape, so this avoids re-writing identical CRUD boilerplate
 * nine times over. Resource-specific behaviour (population, search
 * fields, code prefixes) is passed in as options rather than hard-coded.
 *
 * @param {import('mongoose').Model} Model
 * @param {object} options
 * @param {string} [options.codePrefix] - if set, a human-readable code is auto-generated on create
 * @param {string[]} [options.searchFields] - fields eligible for ?search=
 * @param {string|string[]} [options.populate] - path(s)/spec to populate on read
 */
const createCRUDController = (Model, options = {}) => {
  const { codePrefix, searchFields = [], populate } = options;

  const applyPopulate = (query) => {
    if (!populate) return query;
    return Array.isArray(populate)
      ? populate.reduce((q, p) => q.populate(p), query)
      : query.populate(populate);
  };

  const getAll = asyncHandler(async (req, res) => {
    const featureQuery = new APIFeatures(Model.find(), req.query, searchFields)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const [results, total] = await Promise.all([
      applyPopulate(featureQuery.query),
      Model.countDocuments(featureQuery.query.getFilter()),
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

  const getOne = asyncHandler(async (req, res, next) => {
    const query = applyPopulate(Model.findById(req.params.id));
    const doc = await query;
    if (!doc)
      return next(
        new AppError(
          `${Model.modelName} not found with id ${req.params.id}`,
          404,
        ),
      );
    res.status(200).json({ success: true, data: doc });
  });

  const createOne = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (codePrefix) payload.code = await generateCode(codePrefix);
    const doc = await Model.create(payload);
    res.status(201).json({ success: true, data: doc });
  });

  const updateOne = asyncHandler(async (req, res, next) => {
    const payload = { ...req.body };
    delete payload.code; // codes are immutable once assigned
    const doc = await Model.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return next(
        new AppError(
          `${Model.modelName} not found with id ${req.params.id}`,
          404,
        ),
      );
    res.status(200).json({ success: true, data: doc });
  });

  const deleteOne = asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc)
      return next(
        new AppError(
          `${Model.modelName} not found with id ${req.params.id}`,
          404,
        ),
      );
    res.status(204).json({ success: true, data: null });
  });

  return { getAll, getOne, createOne, updateOne, deleteOne };
};

export default createCRUDController;
