import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const publicUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  photo: user.photo,
  role: user.role,
});

export const register = async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ success: false, message: "Username must be 3–30 characters" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: "Password must be 8–128 characters" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).select("_id");
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email or username already exists" });
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({ username, email, password: hash });
    return res.status(201).json({ success: true, message: "Account created successfully" });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to create account" });
  }
};

export const login = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Incorrect email or password" });
    }
    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({ success: false, message: "Authentication is not configured" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, username: user.username },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );
    const isProduction = process.env.NODE_ENV === "production";
    const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      data: publicUser(user),
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to login" });
  }
};

export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Account no longer exists" });
    }
    return res.status(200).json({ success: true, data: publicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to retrieve session" });
  }
};
