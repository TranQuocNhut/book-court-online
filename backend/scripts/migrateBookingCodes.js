// scripts/migrateBookingCodes.js
// Script để migrate booking codes cho các booking cũ
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import BookingSequence from "../models/BookingSequence.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function migrateBookingCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dat-san-online");
    console.log("Connected to MongoDB");

    // Find all bookings without bookingCode
    const bookings = await Booking.find({ bookingCode: { $exists: false } });
    console.log(`Found ${bookings.length} bookings without bookingCode`);

    let migrated = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        // Lấy ngày từ createdAt hoặc date
        const date = booking.createdAt || booking.date || new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

        // Get or create sequence for that date
        let sequence = await BookingSequence.findOneAndUpdate(
          { date: dateStr },
          { $inc: { sequence: 1 } },
          { upsert: true, new: true }
        );

        const seqNum = sequence.sequence.toString().padStart(4, "0");
        const bookingCode = `BK-${dateStr}-${seqNum}`;

        // Check if code already exists (shouldn't happen but just in case)
        const existing = await Booking.findOne({ bookingCode });
        if (existing && existing._id.toString() !== booking._id.toString()) {
          // If conflict, increment sequence and try again
          sequence = await BookingSequence.findOneAndUpdate(
            { date: dateStr },
            { $inc: { sequence: 1 } },
            { upsert: true, new: true }
          );
          const newSeqNum = sequence.sequence.toString().padStart(4, "0");
          booking.bookingCode = `BK-${dateStr}-${newSeqNum}`;
        } else {
          booking.bookingCode = bookingCode;
        }

        await booking.save();
        migrated++;
        
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated} bookings...`);
        }
      } catch (error) {
        console.error(`Error migrating booking ${booking._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Errors: ${errors}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateBookingCodes();

