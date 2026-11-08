//controllers\heritageSiteController.js
import HeritageSite from "../models/HeritageSite.js";

const escapeRegex = (value) => [...value].map((character) => ".^$*+?()[]{}|".includes(character) || character === String.fromCharCode(92) ? String.fromCharCode(92) + character : character).join("");
const parsePage = (value) => {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, 10000) : 0;
};
const parseSearch = (query) => {
  const city = typeof query.city === "string" ? query.city.trim() : "";
  const distance = Number(query.distance);
  const maxGroupSize = Number(query.maxGroupSize);
  if (city.length < 2 || city.length > 80 ||
      !Number.isFinite(distance) || distance < 0 ||
      !Number.isInteger(maxGroupSize) || maxGroupSize < 1 || maxGroupSize > 1000) {
    return null;
  }
  return {
    city: new RegExp(escapeRegex(city), "i"),
    distance,
    maxGroupSize,
  };
};


// Create new heritage site
export const createHeritageSite = async (req, res) => {
  const newHeritageSite = new HeritageSite(req.body);
  try {
    const savedHeritageSite = await newHeritageSite.save();
    res.status(200).json({
      success: true,
      message: "Successfully Created",
      data: savedHeritageSite,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create. Try again." });
  }
};

// Update heritage site
export const updateHeritageSite = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedHeritageSite = await HeritageSite.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully Updated",
      data: updatedHeritageSite,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
};

// Delete heritage site
export const deleteHeritageSite = async (req, res) => {
  const id = req.params.id;

  try {
    await HeritageSite.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Successfully Deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

// Get single heritage site
export const getSingleHeritageSite = async (req, res) => {
  const id = req.params.id;

  try {
    const heritageSite = await HeritageSite.findById(id).populate("reviews");
    res.status(200).json({
      success: true,
      message: "Successfully Fetched",
      data: heritageSite,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

// Get all heritage sites
export const getAllHeritageSites = async (req, res) => {
  const page = parsePage(req.query.page);

  try {
    const heritageSites = await HeritageSite.find({})
      .populate("reviews")
      .skip(page * 8)
      .limit(8);
    res.status(200).json({
      success: true,
      count: heritageSites.length,
      message: "Successfully Fetched All Data",
      data: heritageSites,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

// Get heritage sites by search
export const getHeritageSiteBySearch = async (req, res) => {
  const filters = parseSearch(req.query);
  if (!filters) {
    return res.status(400).json({ success: false, message: "Invalid search filters" });
  }

  try {
    const heritageSites = await HeritageSite.find({
      city: filters.city,
      distance: { $gte: filters.distance },
      maxGroupSize: { $gte: filters.maxGroupSize },
    }).populate("reviews").limit(50);
    res.status(200).json({
      success: true,
      count: heritageSites.length,
      message: "Successfully Fetched",
      data: heritageSites,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

// Get featured heritage site
export const getFeaturedHeritageSite = async (req, res) => {
  try {
    const heritageSites = await HeritageSite.find({ featured: true })
      .populate("reviews")
      .limit(8);
    res.status(200).json({
      success: true,
      message: "Successfully Fetched All Data",
      data: heritageSites,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

// Get heritage site counts
export const getHeritageSiteCount = async (req, res) => {
  try {
    const heritageSiteCount = await HeritageSite.estimatedDocumentCount();
    res.status(200).json({ success: true, data: heritageSiteCount });
  } catch (err) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};
