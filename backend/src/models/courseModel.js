import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Online", "Physical"], required: true },
    location: { type: String, trim: true, default: "" },
    description: { type: String, trim: true },
    link: { type: String, trim: true, required: true },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, bufferCommands: false }
);

export default mongoose.model("Course", courseSchema);
