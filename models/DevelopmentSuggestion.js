const mongoose = require('mongoose');

const DevelopmentSuggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluationCycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EvaluationCycle',
    required: true
  },
  categories: [{
    name: String,
    score: Number
  }],
  suggestions: [{
    category: String,
    skillBuilding: String,
    resource: String,
    application: String
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewerComments: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('DevelopmentSuggestion', DevelopmentSuggestionSchema);