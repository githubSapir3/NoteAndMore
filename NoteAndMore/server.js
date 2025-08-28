// ===== server.js =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const eventRoutes = require("./routes/events");
const contactRoutes = require("./routes/contacts");
const shoppingRoutes = require("./routes/shopping");
const categoryRoutes = require("./routes/categories");
const userRoutes = require("./routes/users");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

// Middleware
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   MIDDLEWARE (order matters)
   ======================= */

// CORS – simplest dev setup: echo request origin + send credentials
app.use(
  cors({
    origin: true,          // reflect request origin (e.g., http://localhost:5173)
    credentials: true,     // allow cookies/auth headers
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting (for /api only)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* =======================
   DATABASE
   ======================= */
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📱 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📚 SWAGGER: http://localhost:${PORT}/api-docs/#/`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

/* =======================
   ROUTES
   ======================= */

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Task Management API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Public auth routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/contacts", authMiddleware, contactRoutes);
app.use("/api/shopping", authMiddleware, shoppingRoutes);
app.use("/api/categories", authMiddleware, categoryRoutes);
app.use("/api/users", authMiddleware, userRoutes);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API root
app.get("/api", (req, res) => {
  res.json({
    message: "Task Management API",
    documentation: `http://localhost:${PORT}/api-docs`,
    version: "1.0.0",
  });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation Error", details: errors });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      error: "Duplicate field value",
      details: "A resource with this value already exists",
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token", details: "Please log in again" });
  }

  res.status(error.status || 500).json({
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});

module.exports = app;
