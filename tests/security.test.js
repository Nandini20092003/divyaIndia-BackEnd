import test from "node:test";
import assert from "node:assert/strict";
import { verifyToken } from "../utils/verifyToken.js";
import { createRateLimiter } from "../utils/rateLimit.js";
import "../controllers/userController.js";
import "../controllers/bookingController.js";
import "../controllers/reviewController.js";
import "../controllers/tourController.js";
import "../controllers/heritageSiteController.js";
import "../controllers/authController.js";

process.env.JWT_SECRET_KEY = "test-secret-that-is-long-enough-for-unit-tests-123";

const response = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  set(name, value) { this.headers[name] = value; return this; },
});

test("verifyToken rejects requests without a cookie", async () => {
  const res = response();
  let called = false;
  await verifyToken({ cookies: {} }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("verifyToken rejects an invalid signed session", async () => {
  const res = response();
  let called = false;
  await verifyToken({ cookies: { accessToken: "not-a-valid-token" } }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("rate limiter blocks requests after configured threshold", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
  const req = { ip: "198.51.100.20" };
  const first = response();
  let firstNext = false;
  limiter(req, first, () => { firstNext = true; });
  const second = response();
  let secondNext = false;
  limiter(req, second, () => { secondNext = true; });
  assert.equal(firstNext, true);
  assert.equal(secondNext, false);
  assert.equal(second.statusCode, 429);
  assert.ok(second.headers["Retry-After"]);
});
