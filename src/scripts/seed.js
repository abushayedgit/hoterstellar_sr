import { connectDB, disconnectDatabase } from "../config/database.js";
import { seedSuperAdmin } from "../seeders/superAdmin.seeder.js";
import { seedDevData } from "../seeders/devData.seeder.js";
import { logger } from "../utils/logger.js";

const runSeeds = async () => {
  try {
    await connectDB();
    logger.info("Database connected, running seeds...");

    await seedSuperAdmin();
    await seedDevData();

    logger.info("All seeds completed");
    process.exit(0);
  } catch (error) {
    logger.error("Seed failed", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

runSeeds();
