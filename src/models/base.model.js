export const baseSchemaOptions = {
  timestamps: true,
  versionKey: "__v",
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
};

export const paginatePlugin = (schema) => {
  schema.statics.paginate = async function (filter = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = "",
    } = options;

    const skip = (page - 1) * limit;
    const query = this.find(filter);

    if (select) query.select(select);

    const [data, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit),
      this.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
};
