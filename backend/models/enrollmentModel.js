import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    youthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    status: {
      type: String,
      enum: ['Enrolled', 'Completed'],
      default: 'Enrolled',
      required: true,
    },
    completionDate: { type: Date },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;

