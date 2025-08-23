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

// Import Swagger configuration
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

// Import middleware
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== DATABASE CONNECTION =====
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// ===== ROUTES =====

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Task Management API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Authentication routes (public)
app.use("/api/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/contacts", authMiddleware, contactRoutes);
app.use("/api/shopping", authMiddleware, shoppingRoutes);
app.use("/api/categories", authMiddleware, categoryRoutes);
app.use("/api/users", authMiddleware, userRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add info route
app.get("/api", (req, res) => {
  res.json({
    message: "Task Management API",
    documentation: "http://localhost:5000/api-docs",
    version: "1.0.0",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      error: "Duplicate field value",
      details: "A resource with this value already exists",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
      details: "Please log in again",
    });
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📱 API URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 SWAGGER: http://localhost:${PORT}/api-docs/#/`);
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
