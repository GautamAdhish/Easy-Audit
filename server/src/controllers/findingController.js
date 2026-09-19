import Finding from "../models/Finding.js";
import createCRUDController from "./crudControllerFactory.js";

const base = createCRUDController(Finding, {
  codePrefix: "F",
  searchFields: ["title", "description", "department"],
  populate: [
    { path: "auditId", select: "code title department" },
    { path: "assignee", select: "name email role" },
  ],
});

export default base;
