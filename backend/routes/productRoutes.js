const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../Controllers/productController");

const authMiddleware = require("../middleware/authMiddleWare");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


// ===============================
// PUBLIC ROUTES
// ===============================

// GET /api/products
// Get all products
router.get("/", getProducts);

// GET /api/products/:id
// Get single product
router.get("/:id", getProductById);


// ===============================
// ADMIN ONLY ROUTES
// ===============================

// POST /api/products
// Create product
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 5),
  createProduct
);

// PUT /api/products/:id
// Update product
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 5),
  updateProduct
);

// DELETE /api/products/:id
// Delete product
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProduct
);


module.exports = router;