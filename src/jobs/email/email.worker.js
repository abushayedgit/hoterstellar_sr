import { sendEmail } from "../../infrastructure/emailService.js";
import { logger } from "../../utils/logger.js";

export const emailProcessor = async (job) => {
  const { to, subject, html, text } = job.data;

  logger.info("Processing email job", { jobId: job.id, to, subject });

  try {
    const result = await sendEmail(to, subject, html, text);
    return { success: result, to, subject };
  } catch (error) {
    logger.error("Email job failed", {
      jobId: job.id,
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
};
