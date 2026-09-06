import { billboardRepository } from "./billboard.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { sanitizeUrl } from "../../utils/sanitizeHtml.js";

const MAX_CAROUSELS = 5;

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

export const getBillboard = async () => {
  const billboard = await billboardRepository.getSingleton();
  return billboard;
};

export const getBillboardForPublic = async () => {
  const billboard = await billboardRepository.getSingleton();

  return {
    billBoardImg: billboard.billBoardImg,
    Carousels: billboard.Carousels.sort((a, b) => a.order - b.order),
  };
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

  logger.info("Billboard updated", {
    adminId,
    carouselCount: sanitizedCarousels.length,
  });

  return updatedBillboard;
};

export const addCarouselItem = async (carouselItem, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  if (billboard.Carousels.length >= MAX_CAROUSELS) {
    throw new BadRequestError(
      `Maximum ${MAX_CAROUSELS} carousel items allowed`,
    );
  }

  const sanitizedItem = sanitizeCarousels([carouselItem])[0];
  sanitizedItem.order = billboard.Carousels.length;

  billboard.Carousels.push(sanitizedItem);
  billboard.updatedBy = adminId;
  await billboard.save();

  logger.info("Carousel item added", { adminId });

  return billboard;
};

export const updateCarouselItem = async (imgId, updateData, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  const carouselIndex = billboard.Carousels.findIndex(
    (item) => item.img.imgId === imgId,
  );

  if (carouselIndex === -1) {
    throw new NotFoundError("Carousel item not found");
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

  billboard.Carousels.splice(carouselIndex, 1);

  // Reorder remaining items
  billboard.Carousels.forEach((item, index) => {
    item.order = index;
  });

  billboard.updatedBy = adminId;
  await billboard.save();

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

  logger.info("Carousels reordered", { adminId });

  return billboard;
};

export const updatePopupImage = async (popupImageData, adminId) => {
  const billboard = await billboardRepository.getSingleton();

  billboard.billBoardImg = popupImageData;
  billboard.updatedBy = adminId;
  await billboard.save();

  logger.info("Popup image updated", {
    adminId,
    newImgId: popupImageData.imgId,
  });

  return billboard;
};
