import {
  listUsers,
  getUserById,
  softDeleteUser,
  deactivateUser,
  activateUser,
} from "./user.service.js";

export const listUsersController = async (req, res, next) => {
  try {
    const result = await listUsers(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Users retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "User retrieved",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const softDeleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await softDeleteUser(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "User deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await deactivateUser(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "User deactivated",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const activateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await activateUser(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "User activated",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
