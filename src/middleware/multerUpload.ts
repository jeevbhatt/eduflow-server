import multer from "multer";
import { cloudinary, storage } from "./../services/cloudinaryConfig";
import { Request } from "express";

const upload = multer({
  storage: storage,

  fileFilter: (req: Request, file: any, cb: multer.FileFilterCallback) => {
    const allowedFileTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image support garxaa hai!!!"));
    }
  },
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 mb
  },
});

export default upload;
