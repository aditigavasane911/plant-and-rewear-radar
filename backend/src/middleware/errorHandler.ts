import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Server Error]", err);

  const status = (err as any).status || 500;
  const message = err.message || "Internal server error occurred.";

  res.status(status).json({
    error: err.name || "Error",
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
