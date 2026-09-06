import { billboardRepository } from "./billboard.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { sanitizeUrl } from "../../utils/sanitizeHtml.js";
import { getCache, setCache, deleteCache } from "../../utils/cache.js";
import { uploadToImageKit, deleteFromImageKit } from "../../config/storage.js";

const MAX_CAROUSELS = 5;
const BILLBOARD_CACHE_KEY = "cache:billboard:public";

const validateCarouselCount = (carousels) => {
  if (carousels.length > MAX_CAROUSELS) {
    throw new BadRequestError(
      `Maximum ${MAX_CAROUSELS} carousel items allowed`,
    );
  }
};

const sanitizeCarousels = (carousels) => {
  return carousels.map((carousel, index) => ({
    ...carousel,
    order: carousel.order ?? index,
    CTALINK: sanitizeUrl(carousel.CTALINK) || carousel.CTALINK,
  }));
};

const invalidateBillboardCache = async () => {
  await deleteCache(BILLBOARD_CACHE_KEY);
};

export const getBillboard = async () => {
  const billboard = await billboardRepository.getSingleton();
  return billboard;
};

export const getBillboardForPublic = async () => {
  const cached = await getCache(BILLBOARD_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const billboard = await billboardRepository.getSingleton();

  const data = {
    billBoardImg: billboard.billBoardImg,
    Carousels: billboard.Carousels.sort((a, b) => a.order - b.order),
  };

  await setCache(BILLBOARD_CACHE_KEY, data, 300);

  return data;
};

export const updateBillboard = async (updateData, adminId) => {
  const { billBoardImg, Carousels } = updateData;

  validateCarouselCount(Carousels);

  const sanitizedCarousels = sanitizeCarousels(Carousels);

  const updatedBillboard = await billboardRepository.updateSingleton({
    billBoardImg,
    Carousels: sanitizedCarousels,
    updatedBy: adminId,
  });

  await invalidateBillboardCache();

  logger.info("Billboard updated", {
    adminId,
    carouselCount: sanitizedCarousels.length,
  });

  return updatedBillboard;
};

export const addCarouselItem = async (carouselItem, imageFile, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  if (billboard.Carousels.length >= MAX_CAROUSELS) {
    throw new BadRequestError(
      `Maximum ${MAX_CAROUSELS} carousel items allowed`,
    );
  }

  // Upload image
  const fileName = `carousel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await uploadToImageKit(
    imageFile.buffer,
    fileName,
    "billboard/carousels",
  );
  carouselItem.img = {
    url: result.url,
    imgId: result.fileId,
  };

  const sanitizedItem = sanitizeCarousels([carouselItem])[0];
  sanitizedItem.order = billboard.Carousels.length;

  billboard.Carousels.push(sanitizedItem);
  billboard.updatedBy = adminId;
  await billboard.save();

  await invalidateBillboardCache();

  logger.info("Carousel item added", { adminId });

  return billboard;
};

export const updateCarouselItem = async (
  imgId,
  updateData,
  imageFile,
  adminId,
) => {
  const billboard = await billboardRepository.getSingleton();

  const carouselIndex = billboard.Carousels.findIndex(
    (item) => item.img.imgId === imgId,
  );

  if (carouselIndex === -1) {
    throw new NotFoundError("Carousel item not found");
  }

  const oldImageId = billboard.Carousels[carouselIndex].img.imgId;

  // Replace image if new one uploaded
  if (imageFile) {
    const fileName = `carousel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(
      imageFile.buffer,
      fileName,
      "billboard/carousels",
    );
    updateData.img = {
      url: result.url,
      imgId: result.fileId,
    };
  }

  const updatedItem = {
    ...billboard.Carousels[carouselIndex].toObject(),
    ...updateData,
  };

  if (updateData.CTALINK) {
    updatedItem.CTALINK = sanitizeUrl(updateData.CTALINK) || updateData.CTALINK;
  }

  billboard.Carousels[carouselIndex] = updatedItem;
  billboard.updatedBy = adminId;
  await billboard.save();

  // Delete old image after successful DB update
  if (imageFile && oldImageId) {
    await deleteFromImageKit(oldImageId);
  }

  await invalidateBillboardCache();

  logger.info("Carousel item updated", { adminId, imgId });

  return billboard;
};

export const removeCarouselItem = async (imgId, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  const carouselIndex = billboard.Carousels.findIndex(
    (item) => item.img.imgId === imgId,
  );

  if (carouselIndex === -1) {
    throw new NotFoundError("Carousel item not found");
  }

  const oldImageId = billboard.Carousels[carouselIndex].img.imgId;

  billboard.Carousels.splice(carouselIndex, 1);

  billboard.Carousels.forEach((item, index) => {
    item.order = index;
  });

  billboard.updatedBy = adminId;
  await billboard.save();

  // Delete image after successful DB update
  await deleteFromImageKit(oldImageId);

  await invalidateBillboardCache();

  logger.info("Carousel item removed", { adminId, imgId });

  return billboard;
};

export const reorderCarousels = async (carouselsOrder, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  const orderMap = new Map(
    carouselsOrder.map((item) => [item.imgId, item.order]),
  );

  billboard.Carousels.forEach((carousel) => {
    const newOrder = orderMap.get(carousel.img.imgId);
    if (newOrder !== undefined) {
      carousel.order = newOrder;
    }
  });

  billboard.Carousels.sort((a, b) => a.order - b.order);
  billboard.updatedBy = adminId;
  await billboard.save();

  await invalidateBillboardCache();

  logger.info("Carousels reordered", { adminId });

  return billboard;
};

export const updatePopupImage = async (popupImageData, imageFile, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  const oldImageId = billboard.billBoardImg.imgId;

  // Upload new image
  const fileName = `popup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await uploadToImageKit(
    imageFile.buffer,
    fileName,
    "billboard/popup",
  );

  billboard.billBoardImg = {
    image: result.url,
    imgId: result.fileId,
    altText: popupImageData.altText || billboard.billBoardImg.altText,
  };
  billboard.updatedBy = adminId;
  await billboard.save();

  // Delete old image after successful DB update
  if (oldImageId && oldImageId !== "billboard-default") {
    await deleteFromImageKit(oldImageId);
  }

  await invalidateBillboardCache();

  logger.info("Popup image updated", {
    adminId,
    newImgId: result.fileId,
  });

  return billboard;
};
