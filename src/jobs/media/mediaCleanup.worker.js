import { deleteFromImageKit } from "../../config/storage.js";
import { Food } from "../../modules/food/food.model.js";
import { Category } from "../../modules/category/category.model.js";
import { Notice } from "../../modules/notice/notice.model.js";
import { Billboard } from "../../modules/billboard/billboard.model.js";
import { logger } from "../../utils/logger.js";

export const mediaCleanupProcessor = async (job) => {
  const { fileId } = job.data;

  logger.info("Processing media cleanup", { jobId: job.id, fileId });

  try {
    // Check if fileId is referenced anywhere
    const isReferenced = await checkFileReference(fileId);

    if (isReferenced) {
      logger.info("File still referenced, skipping deletion", { fileId });
      return { success: true, skipped: true, fileId };
    }

    await deleteFromImageKit(fileId);

    logger.info("File deleted from ImageKit", { fileId });
    return { success: true, fileId };
  } catch (error) {
    logger.error("Media cleanup failed", {
      jobId: job.id,
      fileId,
      error: error.message,
    });
    throw error;
  }
};

const checkFileReference = async (fileId) => {
  const [foodCount, categoryCount, noticeCount, billboardCount] =
    await Promise.all([
      Food.countDocuments({ "images.fileId": fileId }),
      Category.countDocuments({ imageId: fileId }),
      Notice.countDocuments({ thumbnailId: fileId }),
      Billboard.countDocuments({
        $or: [
          { "billBoardImg.imgId": fileId },
          { "Carousels.img.imgId": fileId },
        ],
      }),
    ]);

  return (
    foodCount > 0 || categoryCount > 0 || noticeCount > 0 || billboardCount > 0
  );
};

export const enqueueMediaCleanup = async (fileId) => {
  const { enqueueJob, QUEUE_NAMES } = await import("../../config/queue.js");
  return enqueueJob(
    QUEUE_NAMES.MEDIA_CLEANUP,
    "deleteFile",
    { fileId },
    {
      jobId: `media-cleanup:${fileId}`,
    },
  );
};
