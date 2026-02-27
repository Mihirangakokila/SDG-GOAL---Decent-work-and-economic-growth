import Training from '../models/trainingModel.js';

export const createTraining = async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      duration,
      mode,
      location,
      certificateAvailable,
      status,
    } = req.body;

    if (!title || !mode) {
      res.status(400).json({ message: 'Title and mode are required' });
      return;
    }

    const training = await Training.create({
      title,
      description,
      requiredSkills: requiredSkills || [],
      duration,
      mode,
      location,
      certificateAvailable: Boolean(certificateAvailable),
      status: status || 'Active',
      organizationId: req.user._id,
    });

    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create training', error: error.message });
  }
};

export const getActiveTrainings = async (req, res) => {
  try {
    const { skill, location, duration, mode } = req.query;

    const query = { status: 'Active' };

    if (location) query.location = location;
    if (duration) query.duration = duration;
    if (mode) query.mode = mode;
    if (skill) query.requiredSkills = skill;

    const trainings = await Training.find(query).sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch active trainings', error: error.message });
  }
};

export const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch trainings', error: error.message });
  }
};

export const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }

    res.json(training);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to fetch training', error: error.message });
  }
};

export const updateTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }

    const fields = [
      'title',
      'description',
      'requiredSkills',
      'duration',
      'mode',
      'location',
      'certificateAvailable',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        training[field] = req.body[field];
      }
    });

    const updated = await training.save();
    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to update training', error: error.message });
  }
};

export const softDeleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      res.status(404).json({ message: 'Training not found' });
      return;
    }

    training.status = 'Inactive';
    const updated = await training.save();
    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to delete training', error: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userSkills = req.user?.skills || [];

    const trainings = await Training.find({ status: 'Active' });

    const recommended = trainings.filter((training) => {
      if (!training.requiredSkills || training.requiredSkills.length === 0) {
        return false;
      }

      const missingSkills = training.requiredSkills.filter(
        (skill) => !userSkills.includes(skill)
      );
      return missingSkills.length > 0;
    });

    res.json(recommended);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch training recommendations',
      error: error.message,
    });
  }
};

