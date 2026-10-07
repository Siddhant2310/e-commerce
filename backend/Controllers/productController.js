const mongoose = require("mongoose");
const fs = require("fs");
const Product = require("../models/productModel");
const cloudinary = require("../config/cloudinary");

// Safe cleanup for local temporary files
const cleanUpFiles = (files = []) => {
  files.forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Local file cleanup error:", err.message);
      }
    }
  });
};

// Extracts Cloudinary public ID from URL to allow deletion
const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const filename = parts.pop().split(".")[0];
  const folder = parts.pop();
  return `${folder}/${filename}`;
};

// Standardized error handler
const handleControllerError = (res, error, defaultMessage, files = []) => {
  if (files.length > 0) cleanUpFiles(files);

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: error.message,
  });
};

// Parses comma-separated strings or arrays from multipart/form-data
const parseArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  const files = req.files || [];

  try {
    const { name, description, price, stock, category, sizes, colors } = req.body;

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      cleanUpFiles(files);
      return res.status(400).json({
        success: false,
        message: "A valid category ID is required",
      });
    }

    // Upload to Cloudinary concurrently and cleanup local files
    const uploadPromises = files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return result.secure_url;
    });

    const imageUrls = await Promise.all(uploadPromises);

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      sizes: parseArrayField(sizes),
      colors: parseArrayField(colors),
      images: imageUrls,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return handleControllerError(res, error, "Error creating product", files);
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "-createdAt",
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.name = { $regex: search,$options: "i" };
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, "Error fetching products");
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findById(id)
      .populate("category", "name description")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return handleControllerError(res, error, "Error fetching product");
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  const files = req.files || [];

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      cleanUpFiles(files);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      cleanUpFiles(files);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updateData = { ...req.body };

    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock) updateData.stock = Number(updateData.stock);
    if (updateData.sizes) updateData.sizes = parseArrayField(updateData.sizes);
    if (updateData.colors) updateData.colors = parseArrayField(updateData.colors);

    // If new files are uploaded, send them to Cloudinary and append
    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return result.secure_url;
      });

      const newUrls = await Promise.all(uploadPromises);
      updateData.images = [...product.images, ...newUrls];
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    return handleControllerError(res, error, "Error updating product", files);
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Clean up images from Cloudinary storage
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((url) => {
        const publicId = getPublicIdFromUrl(url);
        return cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error(`Failed to delete Cloudinary asset (${publicId}):`, err.message);
        });
      });
      await Promise.all(deletePromises);
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Error deleting product");
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};