import {
  getBillboard,
  getBillboardForPublic,
  updateBillboard,
  addCarouselItem,
  updateCarouselItem,
  removeCarouselItem,
  reorderCarousels,
  updatePopupImage,
} from "./billboard.service.js";

export const getBillboardController = async (req, res, next) => {
  try {
    const billboard = await getBillboard();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Billboard retrieved",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicBillboardController = async (req, res, next) => {
  try {
    const billboard = await getBillboardForPublic();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Billboard retrieved",
      data: billboard,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBillboardController = async (req, res, next) => {
  try {
    const updateData = req.body;
    const adminId = req.auth.adminId;

    const billboard = await updateBillboard(updateData, adminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Billboard updated",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const addCarouselItemController = async (req, res, next) => {
  try {
    const carouselItem = req.body;
    const imageFile = req.file;
    const adminId = req.auth.adminId;

    const billboard = await addCarouselItem(carouselItem, imageFile, adminId);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Carousel item added",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCarouselItemController = async (req, res, next) => {
  try {
    const { imgId } = req.params;
    const updateData = req.body;
    const imageFile = req.file;
    const adminId = req.auth.adminId;

    const billboard = await updateCarouselItem(
      imgId,
      updateData,
      imageFile,
      adminId,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Carousel item updated",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const removeCarouselItemController = async (req, res, next) => {
  try {
    const { imgId } = req.params;
    const adminId = req.auth.adminId;

    const billboard = await removeCarouselItem(imgId, adminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Carousel item removed",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const reorderCarouselsController = async (req, res, next) => {
  try {
    const { Carousels } = req.body;
    const adminId = req.auth.adminId;

    const billboard = await reorderCarousels(Carousels, adminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Carousels reordered",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePopupImageController = async (req, res, next) => {
  try {
    const popupImageData = req.body;
    const imageFile = req.file;
    const adminId = req.auth.adminId;

    const billboard = await updatePopupImage(
      popupImageData,
      imageFile,
      adminId,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Popup image updated",
      data: { billboard },
    });
  } catch (error) {
    next(error);
  }
};
