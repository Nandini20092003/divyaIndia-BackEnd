import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { verifyToken, verifyAdmin } from "../utils/verifyToken.js";
import { createRateLimiter } from "../utils/rateLimit.js";

process.env.JWT_SECRET_KEY = "test-secret-that-is-long-enough-for-unit-tests-123";

const response = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  set(name, value) { this.headers[name] = value; return this; },
});

test("verifyToken rejects requests without a cookie", () => {
  const res = response();
  let called = false;
  verifyToken({ cookies: {} }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("verifyToken accepts a valid signed session", () => {
  const token = jwt.sign({ id: "user-1", role: "user" }, process.env.JWT_SECRET_KEY);
  const req = { cookies: { accessToken: token } };
  const res = response();
  let called = false;
  verifyToken(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.user.id, "user-1");
});

test("verifyAdmin rejects a normal user", () => {
  const token = jwt.sign({ id: "user-1", role: "user" }, process.env.JWT_SECRET_KEY);
  const res = response();
  let called = false;
  verifyAdmin({ cookies: { accessToken: token } }, res, () => { called = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(called, false);
});

test("verifyAdmin allows an administrator", () => {
  const token = jwt.sign({ id: "admin-1", role: "admin" }, process.env.JWT_SECRET_KEY);
  const res = response();
  let called = false;
  verifyAdmin({ cookies: { accessToken: token } }, res, () => { called = true; });
  assert.equal(called, true);
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
