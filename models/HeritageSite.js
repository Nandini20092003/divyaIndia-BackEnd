import mongoose from "mongoose";

const heritageSiteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    maxGroupSize: {
      type: Number,
      required: true,
    },
    history: {
      type: String,
    },
    geography: {
      type: String,
    },
    additionalDetails: {
      type: String,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("HeritageSite", heritageSiteSchema);
