const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Only use Cloudinary when real credentials are provided
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Keep files in memory — we decide where to write them in uploadToCloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = async (buffer, folder = "multi-tenant-ecommerce") => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, transformation: [{ width: 800, height: 800, crop: "limit" }] },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  }

  // Local disk fallback — save to backend/public/uploads/<folder>/
  const uploadDir = path.join(__dirname, `../public/uploads/${folder}`);
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
};

module.exports = { cloudinary, upload, uploadToCloudinary };
