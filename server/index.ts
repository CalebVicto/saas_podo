import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { validateToken, refreshToken, logout } from "./routes/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication endpoints
  app.post("/api/auth/validate", validateToken);
  app.post("/api/auth/refresh", refreshToken);
  app.post("/api/auth/logout", logout);

  return app;
}
