import express from "express";
import multer from "multer";
import { deleteImage, uploadImage } from "../controllers/cloudinaryController";

const router = express.Router();

// Configure multer to use the /tmp directory for temporary file storage
const upload = multer({ dest: "/tmp" });

// Route for uploading an image
router.post("/upload", upload.single("file"), uploadImage);

// Route for deleting an image
router.delete("/delete/:public_id", deleteImage);

export default router;
