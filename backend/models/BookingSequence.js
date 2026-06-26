// models/BookingSequence.js
import mongoose from "mongoose";

const bookingSequenceSchema = new mongoose.Schema(
  {
    // Ngày (format: YYYYMMDD)
    date: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Sequence number cho ngày đó
    sequence: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Note: date index được tạo tự động bởi unique: true trong field definition

export default mongoose.model("BookingSequence", bookingSequenceSchema);

