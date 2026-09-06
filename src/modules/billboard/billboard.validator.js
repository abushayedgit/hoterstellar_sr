import { z } from "zod";

const colorSchema = z
  .string()
  .regex(
    /^(#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\))$/,
    "Must be a valid CSS color (HEX, RGB, RGBA, HSL, HSLA)",
  );

const countSentences = (text) => {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  const matches = trimmed.match(/[^.!?]+[.!?]+/g);
  if (!matches) return 1;

  const sentences = matches.length;
  const remaining = trimmed.replace(/[^.!?]+[.!?]+/g, "").trim();

  return remaining ? sentences + 1 : sentences;
};

const carouselImageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  imgId: z.string().min(1, "Image ID is required"),
});

const carouselItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500)
    .refine(
      (text) => countSentences(text) <= 2,
      "Description must contain at most 2 sentences",
    ),
  btnColor: colorSchema,
  bgGlassEffectColor: colorSchema,
  CTALINK: z.string().min(1, "CTA link is required"),
  order: z.number().int().min(0).optional().default(0),
  img: carouselImageSchema,
});

const billboardImageSchema = z.object({
  image: z.string().min(1, "Popup image is required"),
  imgId: z.string().min(1, "Popup image ID is required"),
  altText: z.string().min(1, "Alt text is required").max(300),
});

export const updateBillboardSchema = z.object({
  billBoardImg: billboardImageSchema,
  Carousels: z
    .array(carouselItemSchema)
    .max(5, "Maximum 5 carousel items allowed"),
});

export const addCarouselItemSchema = carouselItemSchema;

export const updateCarouselItemSchema = carouselItemSchema.partial();

export const reorderCarouselsSchema = z.object({
  Carousels: z.array(
    z.object({
      imgId: z.string().min(1),
      order: z.number().int().min(0),
    }),
  ),
});
