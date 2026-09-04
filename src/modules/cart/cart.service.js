import { Cart } from "./cart.model.js";
import { Food } from "../food/food.model.js";
import { cartRepository } from "./cart.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";

const MAX_CART_QTY_PER_ITEM = 20;

export const getCart = async (userId) => {
  let cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    cart = await cartRepository.create({
      userId,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      totalAmount: 0,
    });
  }

  return cart.populate("items.food", "name price discount images isAvailable");
};

export const addToCart = async (
  userId,
  { foodId, quantity, specialInstructions },
) => {
  const food = await Food.findById(foodId);

  if (!food) {
    throw new NotFoundError("Food not found");
  }

  if (!food.isAvailable) {
    throw new BadRequestError("Food is not available");
  }

  let cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    cart = await cartRepository.create({
      userId,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      totalAmount: 0,
    });
  }

  const existingItem = cart.items.find(
    (item) => item.food.toString() === foodId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > MAX_CART_QTY_PER_ITEM) {
      throw new BadRequestError(
        `Maximum ${MAX_CART_QTY_PER_ITEM} units per item`,
      );
    }

    existingItem.quantity = newQuantity;
    existingItem.unitPrice = food.price;
    existingItem.discount = food.discount || 0;
    existingItem.name = food.name;
    existingItem.lineTotal = food.price * newQuantity;

    if (specialInstructions) {
      existingItem.specialInstructions = specialInstructions;
    }
  } else {
    cart.items.push({
      food: foodId,
      name: food.name,
      unitPrice: food.price,
      discount: food.discount || 0,
      quantity,
      specialInstructions: specialInstructions || "",
      lineTotal: food.price * quantity,
    });
  }

  cart.recalculateTotals();
  await cart.save();

  logger.info("Item added to cart", { userId, foodId, quantity });

  return cart.populate("items.food", "name price discount images isAvailable");
};

export const updateCartItem = async (
  userId,
  foodId,
  { quantity, specialInstructions },
) => {
  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const item = cart.items.find((item) => item.food.toString() === foodId);

  if (!item) {
    throw new NotFoundError("Item not found in cart");
  }

  const food = await Food.findById(foodId);
  if (!food || !food.isAvailable) {
    throw new BadRequestError("Food is not available");
  }

  item.quantity = quantity;
  item.unitPrice = food.price;
  item.discount = food.discount || 0;
  item.name = food.name;
  item.lineTotal = food.price * quantity;

  if (specialInstructions !== undefined) {
    item.specialInstructions = specialInstructions;
  }

  cart.recalculateTotals();
  await cart.save();

  logger.info("Cart item updated", { userId, foodId, quantity });

  return cart.populate("items.food", "name price discount images isAvailable");
};

export const removeCartItem = async (userId, foodId) => {
  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.food.toString() === foodId,
  );

  if (itemIndex === -1) {
    throw new NotFoundError("Item not found in cart");
  }

  cart.items.splice(itemIndex, 1);
  cart.recalculateTotals();
  await cart.save();

  logger.info("Cart item removed", { userId, foodId });

  return cart.populate("items.food", "name price discount images isAvailable");
};

export const clearCart = async (userId) => {
  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    return true;
  }

  cart.items = [];
  cart.recalculateTotals();
  await cart.save();

  logger.info("Cart cleared", { userId });

  return true;
};

export const mergeGuestCart = async (userId, guestItems) => {
  let cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    cart = await cartRepository.create({
      userId,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      totalAmount: 0,
    });
  }

  const skippedItems = [];
  const adjustedItems = [];

  for (const guestItem of guestItems) {
    const { foodId, quantity } = guestItem;

    const food = await Food.findById(foodId);

    if (!food || !food.isAvailable) {
      skippedItems.push({
        foodId,
        reason: "Food not available",
      });
      continue;
    }

    const existingItem = cart.items.find(
      (item) => item.food.toString() === foodId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > MAX_CART_QTY_PER_ITEM) {
        existingItem.quantity = MAX_CART_QTY_PER_ITEM;
        adjustedItems.push({
          foodId,
          originalQuantity: quantity,
          adjustedQuantity: MAX_CART_QTY_PER_ITEM - existingItem.quantity,
          reason: "Maximum quantity reached",
        });
      } else {
        existingItem.quantity = newQuantity;
      }

      existingItem.unitPrice = food.price;
      existingItem.discount = food.discount || 0;
      existingItem.name = food.name;
      existingItem.lineTotal = food.price * existingItem.quantity;
    } else {
      const addQuantity = Math.min(quantity, MAX_CART_QTY_PER_ITEM);
      cart.items.push({
        food: foodId,
        name: food.name,
        unitPrice: food.price,
        discount: food.discount || 0,
        quantity: addQuantity,
        specialInstructions: "",
        lineTotal: food.price * addQuantity,
      });

      if (addQuantity < quantity) {
        adjustedItems.push({
          foodId,
          originalQuantity: quantity,
          adjustedQuantity: addQuantity,
          reason: "Maximum quantity reached",
        });
      }
    }
  }

  cart.recalculateTotals();
  await cart.save();

  logger.info("Guest cart merged", { userId, itemCount: guestItems.length });

  const populatedCart = await cart.populate(
    "items.food",
    "name price discount images isAvailable",
  );

  return {
    cart: populatedCart,
    skippedItems,
    adjustedItems,
  };
};
