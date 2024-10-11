import cloudinary from "cloudinary";
import { Request, Response } from "express";

cloudinary.v2.config({
  cloud_name: "dz00iux5j",
  api_key: "299737919222394",
  api_secret: "e_Lgl7n_adnq9aXeCQkBUulfCX4",
});

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const result = await cloudinary.v2.uploader.upload(req.file.path);
    res.status(200).json(result);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  const { public_id } = req.params; // Extracts from URL parameter
  try {
    await cloudinary.v2.uploader.destroy(public_id);
    res.status(200).send("Image deleted successfully");
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};
