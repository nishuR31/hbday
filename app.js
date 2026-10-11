import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import "./utils/env.js";
import route from "./routes/birthdayRoutes.js";
import { initQueueSystem } from "./services/queueService.js";
import { initDatabase } from "./services/db.js";
import { securitySanitizerMiddleware } from "./utils/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Performance: Gzip/Brotli compression for JSON and static responses
app.use(compression());

// Security Headers via Helmet (Strict CSP, Frameguard, MIME sniffing defense)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "about:blank"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors());
app.use(express.json({ limit: "64kb" })); // Defend against oversized JSON payload attacks
app.use(securitySanitizerMiddleware); // Strip script tags, null bytes, and prototype pollution
app.use(morgan("dev"));

// Serve static frontend UI with fresh caching headers (prevents stale browser assets)
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: 0,
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith(".css") || filePath.endsWith(".js")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  })
);

// API health endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    service: "Birthday Automation Service",
    status: "running",
    version: "v1",
    timestamp: new Date().toISOString()
  });
});

// Backward compatibility health check for json clients on /api
app.get("/api", (req, res) => {
  res.status(200).json({
    service: "Birthday Automation Service",
    status: "running",
    version: "v1"
  });
});

// API Routes
app.use("/api/v1", route);

// Serve dashboard on /dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 404 handler for API routes or unhandled paths
app.use((req, res) => {
  if (req.accepts("html") && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "public/index.html"));
  }
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[ServerError]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`[HBday] Service running on http://localhost:${PORT}`);
  console.log(`[HBday] Web Dashboard available at http://localhost:${PORT}`);
  console.log(`[HBday] API Base URL: http://localhost:${PORT}/api/v1`);
  try {
    await initDatabase();
  } catch (dbErr) {
    console.warn(`[Database] Notice during startup database connection: ${dbErr.message}`);
  }
  try {
    await initQueueSystem();
  } catch (queueErr) {
    console.warn(`[BullMQ] Notice during startup initialization: ${queueErr.message}`);
  }
});

export default app;
