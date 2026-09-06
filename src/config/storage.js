import ImageKit from "@imagekit/nodejs";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let imagekitClient = null;

export const getImageKit = () => {
  if (imagekitClient) {
    return imagekitClient;
  }

  if (
    !env.IMAGEKIT_PUBLIC_KEY ||
    !env.IMAGEKIT_PRIVATE_KEY ||
    !env.IMAGEKIT_URL_ENDPOINT
  ) {
    logger.warn("ImageKit not configured - image uploads disabled");
    return null;
  }

  try {
    imagekitClient = new ImageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });

    logger.info("ImageKit client initialized");
    return imagekitClient;
  } catch (error) {
    logger.error("Failed to initialize ImageKit", { error: error.message });
    return null;
  }
};

export const isImageKitConfigured = () => {
  return getImageKit() !== null;
};

export const uploadToImageKit = async (
  fileBuffer,
  fileName,
  folder = "hoterstellar",
) => {
  const imagekit = getImageKit();

  if (!imagekit) {
    throw new Error("ImageKit is not configured");
  }

  try {
    const result = await imagekit.upload({
      file: fileBuffer.toString("base64"),
      fileName,
      folder: `/${folder}`,
      useUniqueFileName: true,
    });

    return {
      url: result.url,
      fileId: result.fileId,
    };
  } catch (error) {
    logger.error("ImageKit upload failed", { error: error.message });
    throw error;
  }
};

export const deleteFromImageKit = async (fileId) => {
  const imagekit = getImageKit();

  if (!imagekit || !fileId) {
    return false;
  }

  try {
    await imagekit.deleteFile(fileId);
    logger.info("ImageKit file deleted", { fileId });
    return true;
  } catch (error) {
    logger.error("ImageKit delete failed", { error: error.message, fileId });
    return false;
  }
};
