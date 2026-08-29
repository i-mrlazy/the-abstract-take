import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

let isConfigured = false;

function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName.trim().length > 0 &&
    apiKey.trim().length > 0 &&
    apiSecret.trim().length > 0 &&
    cloudName !== "MY_CLOUD_NAME" &&
    cloudName !== "your-cloud-name"
  ) {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true,
    });
    isConfigured = true;
  }
}

initCloudinary();

export interface ImageUploadResult {
  url: string;
  publicId?: string;
  filename: string;
  provider: "cloudinary" | "local";
  width?: number;
  height?: number;
  format?: string;
}

export const cloudinaryService = {
  isAvailable(): boolean {
    initCloudinary();
    return isConfigured;
  },

  async uploadBase64(
    dataUrl: string,
    filename = "upload",
    folder = "the-abstract-take/uploads"
  ): Promise<ImageUploadResult> {
    initCloudinary();

    if (!dataUrl || !dataUrl.includes(",")) {
      throw new Error("Invalid base64 image data.");
    }

    // If Cloudinary is configured, upload to Cloudinary CDN
    if (isConfigured) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
          folder,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });

        return {
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
          filename: uploadResponse.original_filename || filename,
          provider: "cloudinary",
          width: uploadResponse.width,
          height: uploadResponse.height,
          format: uploadResponse.format,
        };
      } catch (err: any) {
        console.error("Cloudinary upload failed:", err);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Cloudinary upload failed in production: ${err.message}`);
        }
      }
    }

    // In Production: Strict prevention of local filesystem writes
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[FATAL] Cloudinary is required for media uploads in production. " +
        "Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
      );
    }

    // Development-only fallback: Local uploads directory
    console.warn("[DEV NOTICE] Cloudinary not configured. Storing upload in local data/uploads/ for development.");
    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image format.");
    }

    const extension = matches[1].split("/")[1] || "jpg";
    const buffer = Buffer.from(matches[2], "base64");
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9_-]/g, "")}.${extension}`;
    const savePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(savePath, buffer);

    return {
      url: `/uploads/${safeName}`,
      filename: safeName,
      provider: "local",
    };
  },

  async deleteImage(publicId: string): Promise<boolean> {
    initCloudinary();
    if (!isConfigured || !publicId) return false;
    try {
      const res = await cloudinary.uploader.destroy(publicId);
      return res.result === "ok";
    } catch (err) {
      console.error("Cloudinary deletion failed:", err);
      return false;
    }
  },
};
