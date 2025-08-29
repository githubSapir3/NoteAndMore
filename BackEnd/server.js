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
const adminRoutes = require("./routes/admin");
const communityEventRoutes = require("./routes/communityEvents");
const stickerRoutes = require('./routes/stickerAPI');
// Import Swagger configuration
const { swaggerUi, specs: swaggerSpec } = require("./utils/swagger");

// Import middleware
const { authMiddleware } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====

// Security middleware
app.use(helmet());

// CORS configuration (MUST be before rate limiting)
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://localhost:5174", // Vite fallback port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => {
    // Skip rate limiting for health checks and OPTIONS requests
    return req.path === '/api/health' || req.method === 'OPTIONS';
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Stricter in production
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all auth attempts
});

app.use("/api", limiter);
app.use("/api/auth", authLimiter); // Apply stricter limits to auth routes

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Debug CORS issues
  if (req.method === 'OPTIONS') {
    console.log('🔍 CORS Preflight Request:', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
  }
  
  next();
});

// ===== DATABASE CONNECTION =====
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);

    // ===== START SERVER =====
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
    
    // More detailed error information
    if (error.code === 'ETIMEOUT') {
      console.error("🔍 This is a DNS resolution timeout. Possible causes:");
      console.error("   - Check your internet connection");
      console.error("   - Verify the MongoDB Atlas cluster name is correct");
      console.error("   - Check if your network/firewall is blocking the connection");
      console.error("   - Ensure the MongoDB Atlas cluster is running and accessible");
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error("🔍 DNS resolution failed. The cluster name might be incorrect.");
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error("🔍 Connection refused. Check if the cluster is running and accessible.");
    }
    
    console.error("💡 Troubleshooting steps:");
    console.error("   1. Verify your MONGODB_URI in .env file");
    console.error("   2. Check MongoDB Atlas cluster status");
    console.error("   3. Ensure your IP is whitelisted in Network Access");
    console.error("   4. Verify database user credentials");
    
    process.exit(1);
  });

// Add connection event listeners for better monitoring
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
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

// Community events routes (public for viewing, auth for joining)
app.use("/api/community-events", communityEventRoutes);

// Sticker API routes (public)
app.use("/api/stickerAPI", stickerRoutes);

// Admin routes (require admin authentication)
app.use("/api/admin", adminRoutes);

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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});

module.exports = app;