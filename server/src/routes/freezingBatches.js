const express = require('express');
const router = express.Router();
const {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  getAvailableBatches
} = require('../controllers/freezingBatchController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/freezing-batches - List all batches with filters
router.get('/', getBatches);

// GET /api/freezing-batches/available/:countSize - Get available batches by count size
router.get('/available/:countSize', getAvailableBatches);

// GET /api/freezing-batches/:id - Get single batch
router.get('/:id', getBatch);

// POST /api/freezing-batches - Create new batch
router.post('/', createBatch);

// PUT /api/freezing-batches/:id - Update batch
router.put('/:id', updateBatch);

// DELETE /api/freezing-batches/:id - Delete batch
router.delete('/:id', deleteBatch);

module.exports = router;
