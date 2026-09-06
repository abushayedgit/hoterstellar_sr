import multer from "multer";
import { BadRequestError } from "../errors/BadRequestError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 8;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestError(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed",
      ),
    );
  }
  cb(null, true);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single("image");

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
}).array("images", MAX_FILES);

export const uploadFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([{ name: "images", maxCount: MAX_FILES }]);
