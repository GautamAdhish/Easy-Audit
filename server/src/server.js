import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(
      `IS-Audit API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`,
    );
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => console.log("Process terminated."));
  });
};

start();
