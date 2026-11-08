import mongoose from "mongoose";
import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  const { tourName, fullName, phone, guestSize, bookAt } = req.body || {};
  const phoneValue = String(phone ?? "").trim();
  const guests = Number(guestSize);
  const bookingDate = new Date(bookAt);

  if (
    typeof tourName !== "string" || !tourName.trim() ||
    typeof fullName !== "string" || fullName.trim().length < 2 ||
    !/^\d{7,15}$/.test(phoneValue) ||
    !Number.isInteger(guests) || guests < 1 || guests > 20 ||
    !bookAt || Number.isNaN(bookingDate.getTime())
  ) {
    return res.status(400).json({ success: false, message: "Please provide valid booking details" });
  }

  try {
    const newBooking = new Booking({
      userId: req.user.id,
      username: req.user.username,
      tourName: tourName.trim(),
      fullName: fullName.trim(),
      phone: phoneValue,
      guestSize: guests,
      bookAt: bookingDate,
    });
    const savedBooking = await newBooking.save();
    return res.status(201).json({
      success: true,
      message: "Your tour is booked",
      data: savedBooking,
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to create booking" });
  }
};

export const getBooking = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid booking id" });
  }

  try {
    const filter = req.user.role === "admin"
      ? { _id: id }
      : { _id: id, userId: req.user.id };
    const booking = await Booking.findOne(filter);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    return res.status(200).json({ success: true, message: "Successful", data: booking });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to fetch booking" });
  }
};

export const getAllBooking = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, message: "Successful", data: bookings });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to fetch bookings" });
  }
};
