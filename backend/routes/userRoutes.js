import express from "express";
import { registerUser, getUsers } from "../controllers/userController.js";

const router = express.Router();

// ✅ Save or login user
router.post("/register", registerUser);

// ✅ Debug route (optional, remove in production)
router.get("/", getUsers);

export default router;
