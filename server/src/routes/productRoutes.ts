import { Router } from "express";
import {
  createProduct,
  deactivateProduct,
  getProductByBarcode,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);

// This must appear before /:id
router.get("/barcode/:barcode", getProductByBarcode);

router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id/deactivate", deactivateProduct);

export default router;