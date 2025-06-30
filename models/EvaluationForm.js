const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['rating', 'text'],
    default: 'rating'
  },
  ratingScale: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 5
    }
  }
});

const EvaluationFormSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  evaluationType: {
    type: String,
    enum: ['self', 'manager', 'peer', 'direct_report'],
    required: true
  },
  questions: [QuestionSchema],
  targetRole: String, // Job title this form applies to
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EvaluationForm', EvaluationFormSchema);