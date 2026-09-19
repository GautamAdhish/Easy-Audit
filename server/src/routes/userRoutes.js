import express from "express";
import * as userController from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // every user route requires a logged-in session

router
  .route("/")
  .get(userController.getAll)
  .post(restrictTo("Admin"), userController.createOne);

router
  .route("/:id")
  .get(userController.getOne)
  .patch(restrictTo("Admin"), userController.updateOne)
  .delete(restrictTo("Admin"), userController.deleteOne);

export default router;
