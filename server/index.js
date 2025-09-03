import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const databaseURL = process.env.DATABASE_URL;

// Debug environment variables
console.log("Environment variables:");
console.log("PORT:", process.env.PORT);
console.log("ORIGIN:", process.env.ORIGIN);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);

mongoose
  .connect(databaseURL, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("Database connection successful");
    app.listen(port, () => {
      console.log(`Server is running at port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err.message);
    console.error(
      "Tip: Ensure your IP is allowed in MongoDB Atlas Network Access and that your connection string has the correct username/password and a database name."
    );
    process.exit(1);
  });
