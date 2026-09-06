import { Contact } from "./contact.model.js";

export const contactRepository = {
  findById: (contactId) => Contact.findById(contactId),

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      Contact.find(filter).sort(sort).skip(skip).limit(limit),
      Contact.countDocuments(filter),
    ]);
  },

  create: (data) => Contact.create(data),

  updateById: (contactId, updateData) =>
    Contact.findByIdAndUpdate(contactId, updateData, { new: true }),

  deleteById: (contactId) => Contact.findByIdAndDelete(contactId),
};
