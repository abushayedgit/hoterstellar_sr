import { AppError } from "./AppError.js";

export class ExternalServiceError extends AppError {
  constructor(message = "External service failure") {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", false);
  }
}
