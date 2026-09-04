import {
  createFood,
  listFoods,
  getFoodById,
  updateFood,
  deleteFood,
} from "./food.service.js";

export const createFoodController = async (req, res, next) => {
  try {
    const foodData = req.body;

    const food = await createFood(foodData);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Food created",
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const listFoodsController = async (req, res, next) => {
  try {
    const result = await listFoods(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Foods retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFoodController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const food = await getFoodById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Food retrieved",
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFoodController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const food = await updateFood(id, updateData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Food updated",
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFoodController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteFood(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Food deleted",
    });
  } catch (error) {
    next(error);
  }
};
