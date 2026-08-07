import { Router } from "express";
import {
  createProduct,
  deactivateProduct,
  getProductByBarcode,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = Router();

// Every product route requires a logged-in user
router.use(authenticate);

// Admins and cashiers can read products
router.get("/", getProducts);

// This must remain above /:id
router.get("/barcode/:barcode", getProductByBarcode);

router.get("/:id", getProductById);

// Only administrators can manage products
router.post(
  "/",
  authorizeRoles("ADMIN"),
  createProduct
);

router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  updateProduct
);

router.patch(
  "/:id/deactivate",
  authorizeRoles("ADMIN"),
  deactivateProduct
);

export default router;