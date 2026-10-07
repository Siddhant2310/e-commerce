const mongoose = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

const PRODUCT_POPULATE_FIELDS = "name price stock images category";

// ==========================================
// ADD PRODUCT TO CART
// ==========================================
const addToCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: qty }]
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;

        if (newQuantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} items available in stock`
          });
        }

        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }

      await cart.save();
    }

    await cart.populate("items.product", PRODUCT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: cart
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Error adding product to cart",
      error: error.message
    });
  }
};

// ==========================================
// GET MY CART
// ==========================================
const getCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const cart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      PRODUCT_POPULATE_FIELDS
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { user: userId, items: [] }
      });
    }

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message
    });
  }
};

// ==========================================
// UPDATE CART ITEM QUANTITY
// ==========================================
const updateCartItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer"
      });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in cart"
      });
    }

    item.quantity = qty;
    await cart.save();
    await cart.populate("items.product", PRODUCT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      data: cart
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message
    });
  }
};

// ==========================================
// REMOVE PRODUCT FROM CART
// ==========================================
const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Product is not in cart"
      });
    }

    await cart.save();
    await cart.populate("items.product", PRODUCT_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      data: cart
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Error removing product from cart",
      error: error.message
    });
  }
};

// ==========================================
// CLEAR CART
// ==========================================
const clearCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};