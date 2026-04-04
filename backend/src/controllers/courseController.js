import Course from "../models/courseModel.js";

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
    const courses = await Course.find()
      .populate("organizerId", "name email")
      .sort({ createdAt: -1 })
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
    res.json(courses);
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
