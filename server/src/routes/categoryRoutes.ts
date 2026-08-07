import { Router } from "express";
import { getCategories } from "../controllers/categoryController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Admins and cashiers must be logged in
router.use(authenticate);

router.get("/", getCategories);

export default router;