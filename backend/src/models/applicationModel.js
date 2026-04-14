import mongoose from "mongoose";

const courseApplicationSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    youthId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

courseApplicationSchema.index({ courseId: 1, youthId: 1 }, { unique: true });

export default mongoose.model("CourseApplication", courseApplicationSchema);
