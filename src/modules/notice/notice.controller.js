import {
  createNotice,
  listNotices,
  listPublishedNotices,
  getNoticeById,
  getNoticeBySlug,
  updateNotice,
  deleteNotice,
  publishNotice,
  archiveNotice,
} from "./notice.service.js";

export const createNoticeController = async (req, res, next) => {
  try {
    const noticeData = req.body;
    const imageFile = req.file;
    const adminId = req.auth.adminId;

    const notice = await createNotice(noticeData, imageFile, adminId);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Notice created",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};

export const listNoticesController = async (req, res, next) => {
  try {
    const result = await listNotices(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notices retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listPublishedNoticesController = async (req, res, next) => {
  try {
    const result = await listPublishedNotices(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notices retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoticeController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notice = await getNoticeById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice retrieved",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};

export const getNoticeBySlugController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const notice = await getNoticeBySlug(slug);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice retrieved",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNoticeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const imageFile = req.file;

    const notice = await updateNotice(id, updateData, imageFile);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice updated",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNoticeController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteNotice(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const publishNoticeController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notice = await publishNotice(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice published",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};

export const archiveNoticeController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notice = await archiveNotice(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Notice archived",
      data: { notice },
    });
  } catch (error) {
    next(error);
  }
};
