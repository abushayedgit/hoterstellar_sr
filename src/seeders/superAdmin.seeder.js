import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";

export const seedSuperAdmin = async () => {
  const Admin = mongoose.model("Admin");
  const email = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_SEED_EMAIL;
  const password =
    process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    logger.warn(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD not set, skipping seed",
    );
    return;
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    logger.info("Super admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await Admin.create({
    email,
    password: hashedPassword,
    name: "Super Admin",
    role: "super_admin",
    isActive: true,
    mustChangePassword: false,
  });

  logger.info("Super admin created successfully");
};
