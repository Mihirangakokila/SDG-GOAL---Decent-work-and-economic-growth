import CourseApplication from "../models/applicationModel.js";
import Course from "../models/courseModel.js";

export const applyToCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    try {
      const app = await CourseApplication.create({
        userId: req.user._id,
        courseId,
        status: "applied",
      });
      const populated = await CourseApplication.findById(app._id)
        .populate("courseId")
        .lean();
      res.status(201).json(populated);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: "You have already applied to this course" });
      }
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message || "Application failed" });
  }
};

export const myApplications = async (req, res) => {
  try {
    const list = await CourseApplication.find({ userId: req.user._id })
      .populate("courseId")
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) {
    res
      .status(500)
      .json({ message: e.message || "Failed to load applications" });
  }
};
