import ChecklistItem from "../models/ChecklistItem.js";
import createCRUDController from "./crudControllerFactory.js";

const base = createCRUDController(ChecklistItem, {
  codePrefix: "CL",
  searchFields: ["clause", "title", "description"],
  populate: [
    { path: "auditor", select: "name email role" },
    { path: "auditId", select: "code title" },
  ],
});

export default base;
