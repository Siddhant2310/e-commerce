const express = require("express");
const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus
} = require("../Controllers/orderController");
const authMiddleware = require("../middleware/authMiddleWare");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Apply auth middleware to all order routes
router.use(authMiddleware);

// Client routes
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/my-orders/:id", getMyOrderById);
router.put("/my-orders/:id/cancel", cancelMyOrder);

// Admin routes (admin only)
router.get("/", roleMiddleware("admin"), getAllOrders);
router.put("/:id/status", roleMiddleware("admin"), updateOrderStatus);

module.exports = router;