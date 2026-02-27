import Enrollment from '../models/enrollmentModel.js';
import Training from '../models/trainingModel.js';

export const enrollInTraining = async (req, res) => {
  try {
    const { trainingId } = req.body;

    if (!trainingId) {
      res.status(400).json({ message: 'trainingId is required' });
      return;
    }

    const training = await Training.findById(trainingId);
    if (!training || training.status !== 'Active') {
      res.status(400).json({ message: 'Training is not available for enrollment' });
      return;
    }

    const existing = await Enrollment.findOne({
      youthId: req.user._id,
      trainingId,
    });

    if (existing) {
      res.status(400).json({ message: 'You are already enrolled in this training' });
      return;
    }

    const enrollment = await Enrollment.create({
      youthId: req.user._id,
      trainingId,
      status: 'Enrolled',
    });

    res.status(201).json(enrollment);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to enroll in training', error: error.message });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ youthId: req.user._id })
      .populate('trainingId')
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch enrollments', error: error.message });
  }
};

export const markEnrollmentCompleted = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('trainingId');

    if (!enrollment) {
      res.status(404).json({ message: 'Enrollment not found' });
      return;
    }

    const isOwner = enrollment.youthId.toString() === req.user._id.toString();
    const isPrivileged = ['admin', 'organization'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      res
        .status(403)
        .json({ message: 'You are not allowed to update this enrollment' });
      return;
    }

    enrollment.status = 'Completed';
    enrollment.completionDate = new Date();

    const updated = await enrollment.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update enrollment status',
      error: error.message,
    });
  }
};

