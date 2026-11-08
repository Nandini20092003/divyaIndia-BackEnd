import express from "express";
import { login, logout, register } from "../controllers/authController.js";
import { createRateLimiter } from "../utils/rateLimit.js";

const router = express.Router();
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

export default router;
