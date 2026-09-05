import { Notice } from './notice.model.js';
import { noticeRepository } from './notice.repository.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { logger } from '../../utils/logger.js';
import { generateSlug } from '../../utils/slug.js';
import { sanitizeHtml } from '../../utils/sanitizeHtml.js';

export const createNotice = async (noticeData, adminId) => {
  const { title } = noticeData;

  const existingNotice = await noticeRepository.findBySlug(
    generateSlug(title)
  );

  if (existingNotice) {
    throw new ConflictError(
      'Notice with this title already exists'
    );
  }

  const sanitizedContent = sanitizeHtml(noticeData.content);

  const notice = await noticeRepository.create({
    ...noticeData,
    content: sanitizedContent,
    slug: generateSlug(title),
    authorAdminId: adminId,
    publishedAt:
      noticeData.status === 'published'
        ? new Date()
        : null,
  });

  logger.info('Notice created', {
    noticeId: notice._id,
    adminId,
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
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = query;

  const filter = {};

  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      {
        title: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        cause: {
          $regex: search,
          $options: 'i',
        },
      },
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

  const sort = {
    [sortBy]: sortOrder === 'desc' ? -1 : 1,
  };

  const [notices, total] =
    await noticeRepository.findAll(
      filter,
      { page, limit, sort }
    );

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

  const filter = {
    status: 'published',
    publishedAt: { $ne: null },
  };

  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit),
    Notice.countDocuments(filter),
  ]);

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

export const getNoticeById = async (noticeId) => {
  const notice = await noticeRepository.findById(
    noticeId
  );

  if (!notice) {
    throw new NotFoundError('Notice not found');
  }

  return notice;
};

export const getNoticeBySlug = async (slug) => {
  const notice = await noticeRepository.findBySlug(slug);

  if (!notice || notice.status !== 'published') {
    throw new NotFoundError('Notice not found');
  }

  return notice;
};

export const updateNotice = async (
  noticeId,
  updateData
) => {
  const notice = await noticeRepository.findById(
    noticeId
  );

  if (!notice) {
    throw new NotFoundError('Notice not found');
  }

  if (
    updateData.title &&
    updateData.title !== notice.title
  ) {
    const existingNotice =
      await noticeRepository.findBySlug(
        generateSlug(updateData.title)
      );

    if (
      existingNotice &&
      existingNotice._id.toString() !== noticeId
    ) {
      throw new ConflictError(
        'Notice with this title already exists'
      );
    }

    updateData.slug = generateSlug(updateData.title);
  }

  if (updateData.content) {
    updateData.content =
      sanitizeHtml(updateData.content);
  }

  if (
    updateData.status === 'published' &&
    notice.status !== 'published'
  ) {
    updateData.publishedAt = new Date();
  }

  if (updateData.status === 'archived') {
    updateData.publishedAt = null;
  }

  const updatedNotice =
    await noticeRepository.updateById(
      noticeId,
      updateData
    );

  logger.info('Notice updated', { noticeId });

  return updatedNotice;
};

export const deleteNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(
    noticeId
  );

  if (!notice) {
    throw new NotFoundError('Notice not found');
  }

  await noticeRepository.deleteById(noticeId);

  logger.info('Notice deleted', { noticeId });

  return true;
};

export const publishNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(
    noticeId
  );

  if (!notice) {
    throw new NotFoundError('Notice not found');
  }

  if (notice.status === 'published') {
    throw new BadRequestError(
      'Notice is already published'
    );
  }

  notice.status = 'published';
  notice.publishedAt = new Date();

  await notice.save();

  logger.info('Notice published', { noticeId });

  return notice;
};

export const archiveNotice = async (noticeId) => {
  const notice = await noticeRepository.findById(
    noticeId
  );

  if (!notice) {
    throw new NotFoundError('Notice not found');
  }

  notice.status = 'archived';
  notice.publishedAt = null;

  await notice.save();

  logger.info('Notice archived', { noticeId });

  return notice;
};
