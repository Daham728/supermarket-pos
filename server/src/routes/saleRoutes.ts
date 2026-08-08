import { Router } from "express";
import {
  createSale,
  getSaleById,
  listSales,
} from "../controllers/saleController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listSales);
router.get("/:id", getSaleById);
router.post("/", createSale);

export default router;