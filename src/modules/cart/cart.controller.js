import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
} from "./cart.service.js";

export const getCartController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const cart = await getCart(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Cart retrieved",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCartController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const itemData = req.body;

    const cart = await addToCart(userId, itemData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Item added to cart",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { foodId } = req.params;
    const updateData = req.body;

    const cart = await updateCartItem(userId, foodId, updateData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Cart item updated",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItemController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { foodId } = req.params;

    const cart = await removeCartItem(userId, foodId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Item removed from cart",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const clearCartController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    await clearCart(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Cart cleared",
    });
  } catch (error) {
    next(error);
  }
};

export const mergeGuestCartController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { items } = req.body;

    const result = await mergeGuestCart(userId, items);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Cart merged",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
