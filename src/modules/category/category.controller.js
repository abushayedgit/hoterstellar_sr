import {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "./category.service.js";

export const createCategoryController = async (req, res, next) => {
  try {
    const categoryData = req.body;
    const imageFile = req.file;

    const category = await createCategory(categoryData, imageFile);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Category created",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const listCategoriesController = async (req, res, next) => {
  try {
    const result = await listCategories(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Categories retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await getCategoryById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Category retrieved",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const imageFile = req.file;

    const category = await updateCategory(id, updateData, imageFile);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Category updated",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteCategory(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Category deleted",
    });
  } catch (error) {
    next(error);
  }
};
