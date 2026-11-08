import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const safeUser = (user) => {
  if (!user) return null;
  const value = user.toObject ? user.toObject() : { ...user };
  delete value.password;
  return value;
};

const isOwnerOrAdmin = (req, id) =>
  req.user?.role === "admin" || req.user?.id === id;

export const updateUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }
  if (!isOwnerOrAdmin(req, id)) {
    return res.status(403).json({ success: false, message: "You are not authorized to update this account" });
  }

  const allowedFields = ["username", "email", "photo"];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
  );
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "No valid profile fields supplied" });
  }
  if (updates.username !== undefined) updates.username = String(updates.username).trim();
  if (updates.email !== undefined) updates.email = String(updates.email).trim().toLowerCase();

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: safeUser(updatedUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Username or email is already in use" });
    }
    return res.status(400).json({ success: false, message: "Unable to update profile" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }
  if (!isOwnerOrAdmin(req, id)) {
    return res.status(403).json({ success: false, message: "You are not authorized to delete this account" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "Successfully deleted" });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to delete account" });
  }
};

export const getSingleUser = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }
  if (!isOwnerOrAdmin(req, id)) {
    return res.status(403).json({ success: false, message: "You are not authorized to view this account" });
  }

  try {
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "Successfully fetched", data: safeUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to fetch user" });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").lean();
    return res.status(200).json({ success: true, message: "Successfully fetched users", data: users });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to fetch users" });
  }
};export const createUser = async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password;

  if (username.length < 3 || username.length > 30 ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: "Valid username, email and password are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const savedUser = await User.create({ username, email, password: hash });
    return res.status(201).json({
      success: true,
      message: "Successfully created",
      data: safeUser(savedUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Username or email is already in use" });
    }
    return res.status(500).json({ success: false, message: "Unable to create user" });
  }
};


