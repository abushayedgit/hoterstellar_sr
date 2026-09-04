import { v4 as uuidv4 } from "uuid";
import { AsyncLocalStorage } from "node:async_hooks";

export const requestContext = new AsyncLocalStorage();

export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers["x-request-id"] || uuidv4();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  requestContext.run({ requestId }, () => {
    next();
  });
}
