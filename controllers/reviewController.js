import Tour from "../models/Tour.js";
import HeritageSite from "../models/HeritageSite.js";
import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  const { tourId, siteId } = req.params;
  const newReview = new Review({ ...req.body });

  try {
    const savedReview = await newReview.save();

    if (tourId) {
      await Tour.findByIdAndUpdate(tourId, {
        $push: { reviews: savedReview._id },
      });
    } else if (siteId) {
      await HeritageSite.findByIdAndUpdate(siteId, {
        $push: { reviews: savedReview._id },
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid request: missing tourId or siteId" });
    }

    res.status(201).json({ success: true, message: "Review Submitted", data: savedReview });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to submit review", error: err.message });
  }
};
