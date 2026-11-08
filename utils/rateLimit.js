// Lightweight per-process limiter for small deployments. For multiple instances,
// use a shared store such as Redis so limits are consistent across instances.
const buckets = new Map();

export const createRateLimiter = ({ windowMs, max }) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  // Keep memory bounded and opportunistically remove expired entries.
  if (buckets.size > 10000) {
    for (const [entryKey, entry] of buckets) {
      if (now - entry.startedAt >= windowMs) buckets.delete(entryKey);
    }
    while (buckets.size > 10000) {
      buckets.delete(buckets.keys().next().value);
    }
  }

  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000));
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
  }
  return next();
};
