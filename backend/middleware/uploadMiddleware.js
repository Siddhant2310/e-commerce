const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the temporary directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Temporary disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// File type validation (JPEG, JPG, PNG, WEBP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const isExtensionValid = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const isMimeTypeValid = allowedExtensions.test(file.mimetype);

  if (isExtensionValid && isMimeTypeValid) {
    return cb(null, true);
  }

  const error = new Error("Invalid file type. Only JPEG, JPG, PNG, and WEBP are allowed.");
  error.code = "LIMIT_UNEXPECTED_FILE_TYPE";
  return cb(error, false);
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});

module.exports = upload;