const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../Controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleWare");

const router = express.Router();

// Apply auth to all routes in this router (or remove if read routes should be public)
router.use(authMiddleware);

router
  .route("/")
  .get(getCategories)
  .post(createCategory);

router
  .route("/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;