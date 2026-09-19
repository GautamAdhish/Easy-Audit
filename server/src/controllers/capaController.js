import Capa from "../models/Capa.js";
import createCRUDController from "./crudControllerFactory.js";

const base = createCRUDController(Capa, {
  codePrefix: "C",
  searchFields: ["title", "rootCause", "correctiveAction", "preventiveAction"],
  populate: [
    { path: "findingId", select: "code title severity" },
    { path: "owner", select: "name email role" },
  ],
});

export default base;
