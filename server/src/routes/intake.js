const express = require('express');
const router = express.Router();
const { createIntake, updateIntake, deleteIntake } = require('../controllers/intakeController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createIntake);
router.put('/:id', protect, updateIntake);
router.delete('/:id', protect, deleteIntake);

module.exports = router;
