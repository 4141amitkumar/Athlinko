import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";

dotenv.config();

// ✅ MongoDB connect (sirf ek jagah se)
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:4000", "https://athlinko.vercel.app"],
  credentials: true
}));

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
