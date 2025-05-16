const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/connectDB");
const router = require("./routes/index");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { app, server } = require("./socket/index");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { IpFilter } = require("express-ipfilter");
const helmet = require("helmet");

// Security Headers Middleware
app.use(helmet());

const rateLimiter = new RateLimiterMemory({
  points: 100, // Maximum 100 requests
  duration: 15 * 60, // Per 15 minutes
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (err) {
    res.status(429).json({ error: "Too many requests" });
  }
});

const blockedIps = ["192.168.1.1", "203.0.113.5"];
app.use(
  IpFilter(blockedIps, {
    mode: "deny",
    allowedHeaders: ["x-forwarded-for"],
    detectIp: (req) =>
      req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  })
);

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({
    message: "Server running at " + PORT,
  });
});

app.use("/api", router);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8080;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log("Server running at " + PORT);
  });
});
