const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const User = require('../models/User');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ lastName: 1, firstName: 1 });
    res.json(users);
  } catch (err) {
    console.error('Error in GET /users:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'firstName lastName email')
      .populate('directReports', 'firstName lastName email')
      .populate('peers', 'firstName lastName email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only allow admins or the user themselves to access full details
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle,
        department: user.department
      });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error in GET /users/:id:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin or Self)
router.put(
  '/:id',
  [
    authMiddleware,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('department', 'Department is required').not().isEmpty(),
      check('jobTitle', 'Job title is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check permission
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    try {
      const {
        firstName,
        lastName,
        department,
        jobTitle,
        managerId,
        directReports,
        peers,
        role
      } = req.body;
      
      // Build user object
      const userFields = {
        firstName,
        lastName,
        department,
        jobTitle
      };
      
      // Only admin can update these fields
      if (req.user.role === 'admin') {
        if (managerId) userFields.managerId = managerId;
        if (directReports) userFields.directReports = directReports;
        if (peers) userFields.peers = peers;
        if (role) userFields.role = role;
      }
      
      // Update user
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: userFields },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (err) {
      console.error('Error in PUT /users/:id:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.remove();
    
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error in DELETE /users/:id:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/department/:department
// @desc    Get users by department
// @access  Private
router.get('/department/:department', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ department: req.params.department })
      .select('firstName lastName email jobTitle')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error in GET /users/department/:department:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;