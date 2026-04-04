import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied"],
      default: "applied",
    },
  },
  { timestamps: true, bufferCommands: false }
);

applicationSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("CourseApplication", applicationSchema);
