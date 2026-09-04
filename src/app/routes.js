import { Router } from "express";

export const apiRoutes = Router();

// Temporary placeholder routes
apiRoutes.get("/ping", (req, res) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    code: "OK",
    message: "Pong",
    data: null,
  });
});
