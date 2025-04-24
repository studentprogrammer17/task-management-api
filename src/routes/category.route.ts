import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { checkAdminRole, verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", categoryController.getAllCategories);

router.get("/:id", categoryController.getCategoryById);

router.get("/tasks/:id", verifyToken, categoryController.getTasksByCategory);

router.post("/", verifyToken, checkAdminRole, categoryController.createCategory);

router.put("/:id", verifyToken, checkAdminRole, categoryController.updateCategory);

router.delete("/:id", verifyToken, checkAdminRole, categoryController.deleteCategory);

export default router;
