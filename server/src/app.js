import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import findingRoutes from "./routes/findingRoutes.js";
import capaRoutes from "./routes/capaRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import evidenceRoutes from "./routes/evidenceRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiReportRoutes from "./routes/aiReportRoutes.js";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// --- Security & platform middleware -----------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:"],
      },
    },
  }),
); // sensible security headers (CSP, HSTS, X-Frame-Options, etc.)

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// Rate limiting: protects the API (and login endpoint in particular)
// from brute-force and abuse. Generous for normal SPA usage.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(express.json({ limit: "10kb" })); // small body limit — this API deals in form-sized JSON, not big payloads
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params to prevent NoSQL injection
app.use(hpp()); // guards against HTTP parameter pollution on list/filter query strings

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --- Health check --------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "IS-Audit API is running." });
});

// --- React SPA ------------------------------------------------------------
// In production/demo mode the Express server can serve the built React app
// itself, so the complete application is available from one origin:
//   http://localhost:5000/is-audit
// API endpoints remain under /api and are registered below.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../../client/dist");
const hasClientBuild = fs.existsSync(path.join(clientDist, "index.html"));

if (hasClientBuild) {
  app.use("/is-audit", express.static(clientDist, { index: "index.html" }));

  // BrowserRouter needs the SPA entry point for direct navigation/refreshes
  // such as /is-audit/dashboard or /is-audit/settings.
  const sendSpa = (req, res) =>
    res.sendFile(path.join(clientDist, "index.html"));
  app.get("/is-audit", sendSpa);
  app.get("/is-audit/*", sendSpa);
}

// Convenience redirect for local demos.
app.get("/", (req, res) => res.redirect("/is-audit"));

// --- Routes ---------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/findings", findingRoutes);
app.use("/api/capas", capaRoutes);
app.use("/api/risks", riskRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai-reports", aiReportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
