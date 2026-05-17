const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin tidak diizinkan"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

if (process.env.ENABLE_LEGACY_ROUTES === "true") {
  app.use("/api/emails", require("./routes/emailRoutes"));
  app.use("/api/transactions", require("./routes/transactionRoutes"));
} else {
  app.use((req, res) => {
    res.status(410).json({
      message: "Legacy app dinonaktifkan. Gunakan backend/server.js.",
    });
  });
}

module.exports = app;
