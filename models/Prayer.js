import mongoose from "mongoose";

const PrayerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true, // Index for faster queries
    },
    prayers: [
      {
        name: {
          type: String,
          required: true,
        },
        time: {
          type: String,
          default: "",
        },
        offered: {
          type: Boolean,
          default: true,
        },
        offeredAt: {
          type: String,
          required: true,
        },
        offeredAtTime: {
          type: String,
          required: true,
        },
        subPrayers: {
          type: [
            {
              rakat: {
                type: String,
                required: false,
              },
              type: {
                type: String,
                required: false,
              },
            },
          ],
          default: [],
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Compound index for email and date queries (for user-specific data)
PrayerSchema.index({ email: 1, date: 1 });

// Prevent model re-compilation during hot reloads in development
// Use collection name "salah" as specified (cluster: salah-tracker, db: salah-tracker, collection: salah)
const Prayer = mongoose.models.salah || mongoose.model("salah", PrayerSchema, "salah");

export default Prayer;

