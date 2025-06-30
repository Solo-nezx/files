const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionText: String,
  ratingValue: Number,
  textResponse: String
});

const EvaluationResponseSchema = new mongoose.Schema({
  evaluationCycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EvaluationCycle',
    required: true
  },
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EvaluationForm',
    required: true
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationshipType: {
    type: String,
    enum: ['self', 'manager', 'peer', 'direct_report'],
    required: true
  },
  answers: [AnswerSchema],
  averageScore: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  submittedAt: Date
}, {
  timestamps: true
});

// Calculate average score before saving
EvaluationResponseSchema.pre('save', function(next) {
  if (this.status === 'completed') {
    const ratingAnswers = this.answers.filter(answer => answer.ratingValue);
    if (ratingAnswers.length > 0) {
      const sum = ratingAnswers.reduce((total, answer) => total + answer.ratingValue, 0);
      this.averageScore = sum / ratingAnswers.length;
    }
  }
  next();
});

module.exports = mongoose.model('EvaluationResponse', EvaluationResponseSchema);