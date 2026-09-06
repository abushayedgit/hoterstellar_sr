import { contactRepository } from "./contact.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { logger } from "../../utils/logger.js";
import { verifyRecaptcha } from "../../infrastructure/recaptchaProvider.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";

export const createContact = async (contactData, ip, userAgent, referrer) => {
  const { recaptchaToken, ...contactInfo } = contactData;

  // Verify reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptchaToken, ip);
  if (!recaptchaValid) {
    throw new BadRequestError("reCAPTCHA verification failed");
  }

  const contact = await contactRepository.create({
    ...contactInfo,
    ip: ip || "",
    userAgent: userAgent || "",
    referrer: referrer || "",
  });

  // Emit socket event for admin
  emitAdminEvent("contact:new", {
    contactId: contact._id,
    name: contact.name,
    email: contact.email,
    subject: contact.subject,
  });

  logger.info("Contact form submitted", {
    contactId: contact._id,
    email: contact.email,
  });

  return contact;
};

export const listContacts = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    isSpam,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (isSpam !== undefined) filter.isSpam = isSpam === "true";

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [contacts, total] = await contactRepository.findAll(filter, {
    page,
    limit,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: contacts,
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

export const getContactById = async (contactId) => {
  const contact = await contactRepository.findById(contactId);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  return contact;
};

export const updateContactStatus = async (contactId, status) => {
  const contact = await contactRepository.findById(contactId);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  contact.status = status;
  await contact.save();

  logger.info("Contact status updated", { contactId, status });

  return contact;
};

export const deleteContact = async (contactId) => {
  const contact = await contactRepository.findById(contactId);

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  await contactRepository.deleteById(contactId);

  logger.info("Contact deleted", { contactId });

  return true;
};
