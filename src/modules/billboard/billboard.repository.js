import { Billboard } from "./billboard.model.js";

export const billboardRepository = {
  getSingleton: () => Billboard.getSingleton(),

  findOne: () => Billboard.findOne(),

  findById: (billboardId) => Billboard.findById(billboardId),

  create: (data) => Billboard.create(data),

  updateById: (billboardId, updateData) =>
    Billboard.findByIdAndUpdate(billboardId, updateData, { new: true }),

  updateSingleton: (updateData) =>
    Billboard.findOneAndUpdate({}, updateData, { new: true, upsert: true }),
};
