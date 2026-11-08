import mongoose from "mongoose";
import Tour from "../models/Tour.js";
import HeritageSite from "../models/HeritageSite.js";
import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  const { tourId, siteId } = req.params;
  const targetId = tourId || siteId;
  const targetModel = tourId ? "Tour" : "HeritageSite";
  const reviewText = String(req.body?.reviewText || "").trim();
  const rating = Number(req.body?.rating);

  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ success: false, message: "Invalid review target" });
  }
  if (reviewText.length < 2 || reviewText.length > 2000 || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Review text and a rating from 1 to 5 are required" });
  }

  try {
    const Target = targetModel === "Tour" ? Tour : HeritageSite;
    const target = await Target.findById(targetId).select("_id");
    if (!target) {
      return res.status(404).json({ success: false, message: "Review target not found" });
    }

    const savedReview = await Review.create({
      productId: target._id,
      onModel: targetModel,
      username: req.user.username,
      reviewText,
      rating,
    });
    await Target.findByIdAndUpdate(targetId, { $push: { reviews: savedReview._id } });

    return res.status(201).json({
      success: true,
      message: "Review submitted",
      data: savedReview,
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to submit review" });
  }
};
