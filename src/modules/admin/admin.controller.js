import {
  getAdminById,
  listAdmins,
  updateAdmin,
  deactivateAdmin,
  activateAdmin,
  deleteAdmin,
} from "./admin.service.js";

export const getAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await getAdminById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admin retrieved",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminsController = async (req, res, next) => {
  try {
    const result = await listAdmins(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admins retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const actorAdminId = req.auth.adminId;
    const actorRole = req.auth.role;

    const admin = await updateAdmin(id, updateData, actorAdminId, actorRole);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admin updated",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorAdminId = req.auth.adminId;

    const admin = await deactivateAdmin(id, actorAdminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admin deactivated",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

export const activateAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorAdminId = req.auth.adminId;

    const admin = await activateAdmin(id, actorAdminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admin activated",
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorAdminId = req.auth.adminId;

    await deleteAdmin(id, actorAdminId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Admin deleted",
    });
  } catch (error) {
    next(error);
  }
};
