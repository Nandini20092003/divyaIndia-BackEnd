import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({ success: false, message: "Authentication is not configured" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Session is invalid or expired" });
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
