import { Admin } from "../auth/admin/admin.model.js";

export const adminRepository = {
  findById: (id) => Admin.findById(id),

  findByEmail: (email) => Admin.findOne({ email }),

  findAll: (filter = {}, options = {}) => {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = "",
    } = options;

    const skip = (page - 1) * limit;
    const query = Admin.find(filter);

    if (select) query.select(select);

    return Promise.all([
      query.sort(sort).skip(skip).limit(limit),
      Admin.countDocuments(filter),
    ]);
  },

  create: (data) => Admin.create(data),

  updateById: (id, updateData) =>
    Admin.findByIdAndUpdate(id, updateData, { new: true }),

  deleteById: (id) => Admin.findByIdAndDelete(id),
};
