import mongoose from "mongoose";
import { baseSchemaOptions } from "../../models/base.model.js";

const carouselImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    imgId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const carouselItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    btnColor: {
      type: String,
      required: true,
      default: "#FFFFFF",
    },
    bgGlassEffectColor: {
      type: String,
      required: true,
      default: "rgba(0,0,0,0.35)",
    },
    CTALINK: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    img: {
      type: carouselImageSchema,
      required: true,
    },
  },
  { _id: false },
);

const billboardPopupImageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    imgId: {
      type: String,
      required: true,
    },
    altText: {
      type: String,
      required: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const billboardSchema = new mongoose.Schema(
  {
    billBoardImg: {
      type: billboardPopupImageSchema,
      required: true,
    },
    Carousels: {
      type: [carouselItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          return items.length <= 5;
        },
        message: "Maximum 5 carousel items allowed",
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  baseSchemaOptions,
);

billboardSchema.statics.getSingleton = async function () {
  let billboard = await this.findOne();

  if (!billboard) {
    billboard = await this.create({
      billBoardImg: {
        image: "",
        imgId: "billboard-default",
        altText: "Hoterstellar",
      },
      Carousels: [],
    });
  }

  return billboard;
};

export const Billboard = mongoose.model("Billboard", billboardSchema);
