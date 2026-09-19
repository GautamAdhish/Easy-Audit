import Audit from "../models/Audit.js";
import createCRUDController from "./crudControllerFactory.js";

const base = createCRUDController(Audit, {
  codePrefix: "A",
  searchFields: ["title", "department"],
  populate: [
    { path: "auditor", select: "name email role" },
    { path: "findingsCount" },
  ],
});

export default base;
