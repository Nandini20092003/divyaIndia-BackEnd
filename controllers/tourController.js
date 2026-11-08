//controllers\tourController.js
import Tour from "../models/Tour.js";

const escapeRegex = (value) => [...value].map((character) => ".^$*+?()[]{}|".includes(character) || character === String.fromCharCode(92) ? String.fromCharCode(92) + character : character).join("");
");
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


//create new tour
export const createTour = async (req, res) => {
  const newTour = new Tour(req.body);
  try {
    const savedTour = await newTour.save();
    res.status(200).json({
      success: true,
      message: "Successfully Created",
      data: savedTour,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create. Try again." });
  }
};

//update tour
export const updateTour = async (req, res) => {
  const id = req.params.id;

  try {
    const updatedTour = await Tour.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Successfully Updated",
      data: updatedTour,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
};

//delete tour
export const deleteTour = async (req, res) => {
  const id = req.params.id;

  try {
    await Tour.findByIdAndDelete(id);
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

//getSingle tour
export const getSingleTour = async (req, res) => {
  const id = req.params.id;

  try {
    const tour = await Tour.findById(id).populate("reviews");
    res.status(200).json({
      success: true,
      message: "Successfully Fetched",
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

//getAll tour
export const getAllTour = async (req, res) => {
  //for pagination
  const page = parsePage(req.query.page);

  try {
    const tours = await Tour.find({})
      .populate("reviews")
      .skip(page * 8)
      .limit(8);
    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Successfully Fetched All Data",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

//get tours by search
export const getTourBySearch = async (req, res) => {
  const filters = parseSearch(req.query);
  if (!filters) {
    return res.status(400).json({ success: false, message: "Invalid search filters" });
  }

  try {
    const tours = await Tour.find({
      city: filters.city,
      distance: { $gte: filters.distance },
      maxGroupSize: { $gte: filters.maxGroupSize },
    }).populate("reviews").limit(50);
    res.status(200).json({
      success: true,
      count: tours.length,
      message: "Successfully Fetched",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

//get featured tour
export const getFeaturedTour = async (req, res) => {
  try {
    const tours = await Tour.find({ featured: true })
      .populate("reviews")
      .limit(8);
    res.status(200).json({
      success: true,
      message: "Successfully Fetched All Data",
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Not Found",
    });
  }
};

//get tour counts
export const getTourCount = async (req, res) => {
  try {
    const tourCount = await Tour.estimatedDocumentCount();
    res.status(200).json({ success: true, data: tourCount });
  } catch (err) {
    res.status(404).json({ success: false, message: "Not Found" });
  }
};
