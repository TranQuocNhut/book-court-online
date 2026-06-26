// utils/upload.js
import multer from "multer";

// !! CẤU HÌNH MULTER !!
// Đây là cấu hình cơ bản lưu file vào thư mục 'uploads/'
// Trong production, bạn NÊN DÙNG dịch vụ cloud (S3, Cloudinary)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Tạo thư mục 'uploads' ở root project
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  },
});

// Chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

export default upload;
