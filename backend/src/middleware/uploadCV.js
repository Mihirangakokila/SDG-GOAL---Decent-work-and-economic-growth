import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'internship_cvs',
    resource_type: 'raw', // ✅ auto detects PDF and serves proper MIME
    attachment: true,
    
  },
});

const uploadCV = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

// Middleware that accepts any file field name
export const flexibleUpload = uploadCV.any();

export default uploadCV;