const express = require("express");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require("../Controllers/cartController");
const authMiddleware = require("../middleware/authMiddleWare");

const router = express.Router();

// Apply auth middleware to all cart routes
router.use(authMiddleware);

router.route("/")
  .get(getCart)
  .delete(clearCart);

router.post("/items", addToCart);

router.route("/items/:productId")
  .put(updateCartItem)
  .delete(removeFromCart);

module.exports = router;