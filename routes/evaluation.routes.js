const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const EvaluationForm = require('../models/EvaluationForm');
const EvaluationResponse = require('../models/EvaluationResponse');
const EvaluationCycle = require('../models/EvaluationCycle');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');

// @route   POST api/evaluations/forms
// @desc    Create a new evaluation form
// @access  Private (Admin)
router.post(
  '/forms',
  [
    authMiddleware,
    adminMiddleware,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('evaluationType', 'Evaluation type is required').isIn(['self', 'manager', 'peer', 'direct_report']),
      check('questions', 'Questions are required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { title, description, evaluationType, questions, targetRole } = req.body;
      
      const newForm = new EvaluationForm({
        title,
        description,
        evaluationType,
        questions,
        targetRole,
        createdBy: req.user.id
      });
      
      const form = await newForm.save();
      res.json(form);
    } catch (err) {
      console.error('Error in POST /evaluations/forms:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/evaluations/forms
// @desc    Get all evaluation forms
// @access  Private (Admin)
router.get('/forms', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const forms = await EvaluationForm.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName');
    
    res.json(forms);
  } catch (err) {
    console.error('Error in GET /evaluations/forms:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations/forms/:id
// @desc    Get evaluation form by ID
// @access  Private
router.get('/forms/:id', authMiddleware, async (req, res) => {
  try {
    const form = await EvaluationForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Evaluation form not found' });
    }
    
    res.json(form);
  } catch (err) {
    console.error('Error in GET /evaluations/forms/:id:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/evaluations/cycles
// @desc    Create a new evaluation cycle
// @access  Private (Admin)
router.post(
  '/cycles',
  [
    authMiddleware,
    adminMiddleware,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('startDate', 'Start date is required').isISO8601(),
      check('endDate', 'End date is required').isISO8601(),
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        targetDepartments,
        participants
      } = req.body;
      
      // Validate dates
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      
      const newCycle = new EvaluationCycle({
        title,
        description,
        startDate,
        endDate,
        targetDepartments: targetDepartments || [],
        participants: participants || [],
        createdBy: req.user.id
      });
      
      const cycle = await newCycle.save();
      
      // If participants are specified, send notifications
      if (participants && participants.length > 0) {
        NotificationService.notifyEvaluationCycleStart(cycle);
      }
      
      res.json(cycle);
    } catch (err) {
      console.error('Error in POST /evaluations/cycles:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/evaluations/cycles
// @desc    Get all evaluation cycles
// @access  Private
router.get('/cycles', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : {
      'participants.userId': req.user.id
    };
    
    const cycles = await EvaluationCycle.find(query)
      .sort({ startDate: -1 })
      .populate('createdBy', 'firstName lastName');
    
    res.json(cycles);
  } catch (err) {
    console.error('Error in GET /evaluations/cycles:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/evaluations/responses
// @desc    Submit an evaluation response
// @access  Private
router.post(
  '/responses',
  [
    authMiddleware,
    [
      check('evaluationCycleId', 'Evaluation cycle ID is required').isMongoId(),
      check('formId', 'Form ID is required').isMongoId(),
      check('evaluatedUserId', 'Evaluated user ID is required').isMongoId(),
      check('relationshipType', 'Relationship type is required').isIn(['self', 'manager', 'peer', 'direct_report']),
      check('answers', 'Answers are required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const {
        evaluationCycleId,
        formId,
        evaluatedUserId,
        relationshipType,
        answers,
        status
      } = req.body;
      
      // Check if this evaluation response already exists
      const existingResponse = await EvaluationResponse.findOne({
        evaluationCycleId,
        formId,
        evaluatorId: req.user.id,
        evaluatedUserId
      });
      
      if (existingResponse) {
        // Update existing response
        existingResponse.answers = answers;
        existingResponse.status = status || 'completed';
        if (status === 'completed') {
          existingResponse.submittedAt = Date.now();
        }
        
        await existingResponse.save();
        return res.json(existingResponse);
      }
      
      // Create new response
      const newResponse = new EvaluationResponse({
        evaluationCycleId,
        formId,
        evaluatorId: req.user.id,
        evaluatedUserId,
        relationshipType,
        answers,
        status: status || 'completed'
      });
      
      if (status === 'completed' || !status) {
        newResponse.submittedAt = Date.now();
      }
      
      const response = await newResponse.save();
      
      // If completed, notify the evaluated user if it's not a self-evaluation
      if ((status === 'completed' || !status) && relationshipType !== 'self') {
        NotificationService.notifyEvaluationCompleted(response);
      }
      
      res.json(response);
    } catch (err) {
      console.error('Error in POST /evaluations/responses:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/evaluations/responses/pending
// @desc    Get pending evaluations for current user
// @access  Private
router.get('/responses/pending', authMiddleware, async (req, res) => {
  try {
    // Find active evaluation cycles that include this user
    const activeCycles = await EvaluationCycle.find({
      'participants.userId': req.user.id,
      status: 'active',
      endDate: { $gte: new Date() }
    });
    
    if (activeCycles.length === 0) {
      return res.json([]);
    }
    
    const activeCycleIds = activeCycles.map(cycle => cycle._id);
    
    // Find all pending evaluations for these cycles
    const pendingEvaluations = await EvaluationResponse.find({
      evaluationCycleId: { $in: activeCycleIds },
      evaluatorId: req.user.id,
      status: { $in: ['pending', 'in_progress'] }
    })
    .populate('evaluatedUserId', 'firstName lastName email jobTitle')
    .populate('formId', 'title description evaluationType')
    .populate('evaluationCycleId', 'title endDate');
    
    res.json(pendingEvaluations);
  } catch (err) {
    console.error('Error in GET /evaluations/responses/pending:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations/results/:userId
// @desc    Get evaluation results for a user
// @access  Private
router.get('/results/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check permissions - only admin or the user themselves can see results
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view these results' });
    }
    
    // Get all completed evaluations for this user
    const evaluations = await EvaluationResponse.find({
      evaluatedUserId: userId,
      status: 'completed'
    })
    .populate('evaluatorId', 'firstName lastName')
    .populate('formId', 'title description evaluationType')
    .populate('evaluationCycleId', 'title startDate endDate');
    
    // Process results by cycle and relationship type
    const resultsByCycle = evaluations.reduce((acc, evaluation) => {
      const cycleId = evaluation.evaluationCycleId._id.toString();
      
      if (!acc[cycleId]) {
        acc[cycleId] = {
          cycleTitle: evaluation.evaluationCycleId.title,
          cycleDates: {
            start: evaluation.evaluationCycleId.startDate,
            end: evaluation.evaluationCycleId.endDate
          },
          results: {
            self: [],
            manager: [],
            peer: [],
            direct_report: []
          }
        };
      }
      
      // Add to appropriate relationship type
      acc[cycleId].results[evaluation.relationshipType].push({
        evaluationId: evaluation._id,
        evaluatorName: evaluation.relationshipType === 'self' ? 'Self' : 
          `${evaluation.evaluatorId.firstName} ${evaluation.evaluatorId.lastName}`,
        formTitle: evaluation.formId.title,
        averageScore: evaluation.averageScore,
        submittedAt: evaluation.submittedAt
      });
      
      return acc;
    }, {});
    
    // Calculate averages per cycle and category
    Object.values(resultsByCycle).forEach(cycle => {
      // Calculate overall average
      let totalSum = 0;
      let totalCount = 0;
      
      Object.entries(cycle.results).forEach(([type, evaluations]) => {
        if (evaluations.length > 0) {
          const sum = evaluations.reduce((sum, eval) => sum + (eval.averageScore || 0), 0);
          cycle.results[`${type}Average`] = sum / evaluations.length;
          
          totalSum += sum;
          totalCount += evaluations.length;
        }
      });
      
      cycle.overallAverage = totalCount > 0 ? totalSum / totalCount : null;
    });
    
    res.json(Object.values(resultsByCycle));
  } catch (err) {
    console.error('Error in GET /evaluations/results/:userId:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;