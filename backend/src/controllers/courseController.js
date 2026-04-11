import Course from "../models/courseModel.js";
import CourseApplication from "../models/applicationModel.js";

const isValidUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const listCourses = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const type = (req.query.type || "").toString().trim(); // Online | Physical
    const location = (req.query.location || "").toString().trim();
    const sort = (req.query.sort || "newest").toString().trim(); // newest | oldest

    const filter = {};
    if (type && ["Online", "Physical"].includes(type)) {
      filter.type = type;
    }

    const and = [];
    if (q) {
      and.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      });
    }
    if (location) {
      and.push({ location: { $regex: location, $options: "i" } });
    }
    if (and.length) filter.$and = and;

    const sortSpec = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const courses = await Course.find(filter)
      .populate("organizerId", "name email")
      .sort(sortSpec)
      .lean();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to list courses" });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { title, type, location, description, link } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Course name is required" });
    }
    if (!["Online", "Physical"].includes(type)) {
      return res.status(400).json({ message: "Type must be Online or Physical" });
    }
    if (type === "Physical" && (!location || !String(location).trim())) {
      return res
        .status(400)
        .json({ message: "Location is required for physical courses" });
    }
    if (!link || !String(link).trim()) {
      return res.status(400).json({ message: "Course link is required" });
    }
    if (!isValidUrl(link.trim())) {
      return res
        .status(400)
        .json({ message: "Course link must be a valid http(s) URL" });
    }

    const course = await Course.create({
      title: title.trim(),
      type,
      location: type === "Physical" ? location.trim() : "",
      description: description ? String(description).trim() : "",
      link: link.trim(),
      organizerId: req.user._id,
    });

    const populated = await Course.findById(course._id)
      .populate("organizerId", "name email")
      .lean();

    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to create course" });
  }
};

export const myCourses = async (req, res) => {
  try {
    const courses = await Course.find({ organizerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    if (!courses.length) return res.json(courses);

    const ids = courses.map((c) => c._id);
    const agg = await CourseApplication.aggregate([
      { $match: { courseId: { $in: ids } } },
      { $group: { _id: "$courseId", applicationCount: { $sum: 1 } } },
    ]);
    const countById = new Map(
      agg.map((row) => [String(row._id), row.applicationCount])
    );
    const withCounts = courses.map((c) => ({
      ...c,
      applicationCount: countById.get(String(c._id)) || 0,
    }));
    res.json(withCounts);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load your courses" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own courses" });
    }

    const { title, type, location, description, link } = req.body;

    if (title !== undefined) course.title = String(title).trim();
    if (description !== undefined) course.description = String(description).trim();
    if (type !== undefined) {
      if (!["Online", "Physical"].includes(type)) {
        return res.status(400).json({ message: "Type must be Online or Physical" });
      }
      course.type = type;
    }
    if (course.type === "Physical") {
      if (location !== undefined) {
        if (!String(location).trim()) {
          return res
            .status(400)
            .json({ message: "Location is required for physical courses" });
        }
        course.location = String(location).trim();
      }
    } else {
      course.location = "";
    }
    if (link !== undefined) {
      if (!String(link).trim())
        return res.status(400).json({ message: "Course link is required" });
      if (!isValidUrl(link.trim())) {
        return res
          .status(400)
          .json({ message: "Course link must be a valid http(s) URL" });
      }
      course.link = link.trim();
    }

    await course.save();
    const populated = await Course.findById(course._id)
      .populate("organizerId", "name email")
      .lean();
    res.json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to update course" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own courses" });
    }

    await course.deleteOne();
    res.json({ message: "Course deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to delete course" });
  }
};
