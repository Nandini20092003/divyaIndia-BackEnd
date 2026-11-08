import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({ success: false, message: "Authentication is not configured" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({ success: false, message: "Session is invalid or expired" });
  }

  try {
    // Resolve the current account on each authenticated request so deleted users
    // and changed roles do not retain access through an old JWT claim.
    const account = await User.findById(decoded.id).select("_id role username");
    if (!account) {
      return res.status(401).json({ success: false, message: "Account no longer exists" });
    }

    req.user = {
      id: account._id.toString(),
      role: account.role,
      username: account.username,
    };
    return next();
  } catch {
    return res.status(503).json({ success: false, message: "Authentication service temporarily unavailable" });
  }
};

export const verifyUser = (req, res, next) => verifyToken(req, res, next);

export const verifyAdmin = (req, res, next) => {
  return verifyToken(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrator access required" });
    }
    return next();
  });
};
