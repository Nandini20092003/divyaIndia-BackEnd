import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import tourRoute from "./routes/tours.js";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import reviewRoute from "./routes/reviews.js";
import bookingRoute from "./routes/bookings.js";
import heritageSiteRoute from "./routes/heritageSites.js";
import { createRateLimiter } from "./utils/rateLimit.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8000;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!process.env.MONGO_URI || !process.env.JWT_SECRET_KEY) {
  throw new Error("MONGO_URI and JWT_SECRET_KEY must be configured");
}
if (isProduction && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_URL must be configured in production");
}
if (process.env.JWT_SECRET_KEY.length < 32) {
  throw new Error("JWT_SECRET_KEY must contain at least 32 characters");
}

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 600,
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "degraded",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api/v1", createRateLimiter({ windowMs: 60 * 1000, max: 120 }));
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/tours", tourRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/booking", bookingRoute);
app.use("/api/v1/heritageSites", heritageSiteRoute);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ success: false, message: "Invalid JSON request body" });
  }
  console.error("Unhandled request error:", error?.message || "Unknown error");
  return res.status(500).json({ success: false, message: "Internal server error" });
});

let server;
const startServer = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    minPoolSize: 0,
  });
  console.log("MongoDB connected");

  server = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
};

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down gracefully`);
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        process.exit(0);
      } catch (error) {
        console.error("Shutdown error:", error.message);
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer().catch((error) => {
  console.error("Application startup failed:", error.message);
  process.exit(1);
});

export default app;
