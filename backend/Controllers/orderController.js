const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

const PRODUCT_POPULATE_FIELDS = "name price images";
const REQUIRED_ADDRESS_FIELDS = ["fullName", "phone", "address", "city", "state", "pincode"];
const ALLOWED_ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
// Which status an admin may move an order to, from each current status
const STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { shippingAddress, paymentMethod = "COD" } = req.body;

    const hasCompleteAddress =
      shippingAddress &&
      REQUIRED_ADDRESS_FIELDS.every((field) => Boolean(shippingAddress[field]));

    if (!hasCompleteAddress) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required"
      });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = productMap.get(cartItem.product.toString());

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available"
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}`
        });
      }

      totalAmount += product.price * cartItem.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.images?.[0] || ""
      });
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode
      },
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending"
    });

    // Decrement inventory using bulk operations
    const bulkStockUpdates = cart.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } }
      }
    }));
    await Product.bulkWrite(bulkStockUpdates);

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message
    });
  }
};

// ==========================================
// GET MY ORDERS
// ==========================================
const getMyOrders = async (req, res) => {
  try {
    const { userId } = req.user;

    const orders = await Order.find({ user: userId })
      .populate("items.product", PRODUCT_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message
    });
  }
};

// ==========================================
// GET SINGLE MY ORDER
// ==========================================
const getMyOrderById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({ _id: id, user: userId }).populate(
      "items.product",
      PRODUCT_POPULATE_FIELDS
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
};

// ==========================================
// CANCEL MY ORDER
// ==========================================
const cancelMyOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled"
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    // Restore stock using bulk operations
    const bulkStockRestores = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } }
      }
    }));
    await Product.bulkWrite(bulkStockRestores);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message
    });
  }
};

// ==========================================
// ADMIN: GET ALL ORDERS
// ==========================================
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", PRODUCT_POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching all orders",
      error: error.message
    });
  }
};

// ==========================================
// ADMIN: UPDATE ORDER STATUS
// ==========================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!STATUS_FLOW[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change an order from ${order.orderStatus} to ${orderStatus}`
      });
    }

    order.orderStatus = orderStatus;
    // Cash on Delivery is collected when the order is delivered
    if (orderStatus === "delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "paid";
    }
    await order.save();

    // Rejecting/cancelling an order puts its items back in stock
    if (orderStatus === "cancelled") {
      await Product.bulkWrite(
        order.items.map((item) => ({
          updateOne: { filter: { _id: item.product }, update: { $inc: { stock: item.quantity } } }
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus
};