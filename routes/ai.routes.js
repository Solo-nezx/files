const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const AIService = require('../services/ai.service');
const EvaluationResponse = require('../models/EvaluationResponse');

// Generate evaluation questions based on job role and type
router.post('/generate-questions', authMiddleware, async (req, res) => {
  try {
    const { jobTitle, evaluationType } = req.body;
    
    if (!jobTitle || !evaluationType) {
      return res.status(400).json({ message: 'Job title and evaluation type are required' });
    }
    
    const questions = await AIService.generateEvaluationQuestions(jobTitle, evaluationType);
    res.json({ questions });
  } catch (error) {
    console.error('Error in generate-questions endpoint:', error);
    res.status(500).json({ message: 'Server error generating questions' });
  }
});

// Generate development suggestions based on evaluation results
router.get('/development-suggestions/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access these suggestions' });
    }
    
    // Get completed evaluation responses for this user
    const evaluationResponses = await EvaluationResponse.find({
      evaluatedUserId: userId,
      status: 'completed'
    });
    
    if (evaluationResponses.length === 0) {
      return res.status(404).json({ message: 'No completed evaluations found' });
    }
    
    const suggestions = await AIService.generateDevelopmentSuggestions(userId, evaluationResponses);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in development-suggestions endpoint:', error);
    res.status(500).json({ message: 'Server error generating development suggestions' });
  }
});

module.exports = router;