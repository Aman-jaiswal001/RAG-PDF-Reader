import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Document =
  mongoose.model(
    "Document",
    documentSchema
  );