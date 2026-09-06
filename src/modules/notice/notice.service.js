import { Notice } from "./notice.model.js";
import { noticeRepository } from "./notice.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { generateSlug } from "../../utils/slug.js";
import { sanitizeHtml } from "../../utils/sanitizeHtml.js";
import { getCache, setCache, deleteCache } from "../../utils/cache.js";
import { uploadToImageKit, deleteFromImageKit } from "../../config/storage.js";

import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

let trackedNoticeCacheKeys = new Set();

const invalidateAllNoticeCaches = async () => {
  for (const key of trackedNoticeCacheKeys) {
    await deleteCache(key);
  }
  trackedNoticeCacheKeys.clear();
};

export const createNotice = async (noticeData, imageFile, adminId) => {
  const { title } = noticeData;

  const existingNotice = await noticeRepository.findBySlug(generateSlug(title));

  if (existingNotice) {
    throw new ConflictError("Notice with this title already exists");
  }

  const sanitizedContent = sanitizeHtml(noticeData.content);

  let thumbnail = "";
  let thumbnailId = "";

  if (imageFile) {
    const fileName = `notice-${generateSlug(title)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(
      imageFile.buffer,
      fileName,
      "notices",
    );
    thumbnail = result.url;
    thumbnailId = result.fileId;
  }

  const notice = await noticeRepository.create({
    ...noticeData,
    content: sanitizedContent,
    slug: generateSlug(title),
    thumbnail,
    thumbnailId,
    authorAdminId: adminId,
    publishedAt: noticeData.status === "published" ? new Date() : null,
  });

  await invalidateAllNoticeCaches();

  logger.info("Notice created", {
    noticeId: notice._id,
    adminId,
  });

  emitAdminEvent(SOCKET_EVENTS.NOTICE_CREATED, {
    noticeId: notice._id,
    title: notice.title,
    slug: notice.slug,
  });

  return notice;
};

export const listNotices = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    dateFrom,
    dateTo,
    sortBy = "publishedAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { cause: { $regex: search, $options: "i" } },
    ];
  }

  if (dateFrom || dateTo) {
    filter.publishedAt = {};

    if (dateFrom) {
      filter.publishedAt.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      filter.publishedAt.$lte = new Date(dateTo);
    }
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [notices, total] = await noticeRepository.findAll(filter, {
    page,
    limit,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: notices,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const listPublishedNotices = async (query) => {
  const { page = 1, limit = 10 } = query;

  const cacheKey = `cache:notices:published:${page}:${limit}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const filter = {
    status: "published",
    publishedAt: { $ne: null },
  };

  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    Notice.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Notice.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const data = {
    data: notices,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  trackedNoticeCacheKeys.add(cacheKey);
  await setCache(cacheKey, data, 120);

  return data;
};

export const getNoticeById = async (noticeId) => {
  const notice = await noticeRepository.findById(noticeId);

  if (!notice) {
    throw new NotFoundError("Notice not found");
  }

  return notice;
};

export const getNoticeBySlug = async (slug) => {
  const cacheKey = `cache:notices:${slug}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const notice = await noticeRepository.findBySlug(slug);

  if (!notice || notice.status !== "published") {
    throw new NotFoundError("Notice not found");
  }

  const noticeData = notice.toJSON();
  await setCache(cacheKey, noticeData, 300);

  return noticeData;
};

export const updateNotice = async (noticeId, updateData, imageFile) => {
  const notice = await noticeRepository.findById(noticeId);

  if (!notice) {
    throw new NotFoundError("Notice not found");
  }

  if (updateData.title && updateData.title !== notice.title) {
    const existingNotice = await noticeRepository.findBySlug(
      generateSlug(updateData.title),
    );

    if (existingNotice && existingNotice._id.toString() !== noticeId) {
      throw new ConflictError("Notice with this title already exists");
    }

    updateData.slug = generateSlug(updateData.title);
  }

  if (updateData.content) {
    updateData.content = sanitizeHtml(updateData.content);
  }

  if (updateData.status === "published" && notice.status !== "published") {
    updateData.publishedAt = new Date();
  }

  if (updateData.status === "archived") {
    updateData.publishedAt = null;
  }

  // Replace thumbnail if new one uploaded
  if (imageFile) {
    const oldThumbnailId = notice.thumbnailId;

    const fileName = `notice-${notice.slug || "update"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await uploadToImageKit(
      imageFile.buffer,
      fileName,
      "notices",
    );
    updateData.thumbnail = result.url;
    updateData.thumbnailId = result.fileId;

    // Delete old thumbnail after successful DB update
    if (oldThumbnailId) {
      await deleteFromImageKit(oldThumbnailId);
    }
  }

  const updatedNotice = await noticeRepository.updateById(noticeId, updateData);

  await deleteCache(`cache:notices:${notice.slug}`);
  await invalidateAllNoticeCaches();

  logger.info("Notice updated", { noticeId });

  return updatedNotice;
};

export const deleteNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(noticeId);

  if (!notice) {
    throw new NotFoundError("Notice not found");
  }

  // Delete thumbnail from ImageKit
  if (notice.thumbnailId) {
    await deleteFromImageKit(notice.thumbnailId);
  }

  await noticeRepository.deleteById(noticeId);

  await deleteCache(`cache:notices:${notice.slug}`);
  await invalidateAllNoticeCaches();

  logger.info("Notice deleted", { noticeId });

  emitAdminEvent(SOCKET_EVENTS.NOTICE_DELETED, {
    noticeId,
  });

  return true;
};

export const publishNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(noticeId);

  if (!notice) {
    throw new NotFoundError("Notice not found");
  }

  if (notice.status === "published") {
    throw new BadRequestError("Notice is already published");
  }

  notice.status = "published";
  notice.publishedAt = new Date();

  await notice.save();

  await invalidateAllNoticeCaches();

  logger.info("Notice published", { noticeId });

  return notice;
};

export const archiveNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(noticeId);

  if (!notice) {
    throw new NotFoundError("Notice not found");
  }

  notice.status = "archived";
  notice.publishedAt = null;

  await notice.save();

  await deleteCache(`cache:notices:${notice.slug}`);
  await invalidateAllNoticeCaches();

  logger.info("Notice archived", { noticeId });

  return notice;
};
