const FreezingBatch = require('../models/FreezingBatch');
const Company = require('../models/Company');
const Warehouse = require('../models/Warehouse');

// Generate next batch number
const generateBatchNumber = async (company, session) => {
  const prefix = company.batchPrefix || 'FB';
  const counter = company.batchCounter || 1;
  const number = String(counter).padStart(4, '0');
  await Company.findByIdAndUpdate(company._id, { $inc: { batchCounter: 1 } }, { session });
  return `${prefix}-${number}`;
};

// GET /api/freezing-batches
const getBatches = async (req, res, next) => {
  try {
    const { status, countSize, page = 1, limit = 50, from, to } = req.query;
    const query = { company: req.companyId };

    if (status && status !== 'All') query.status = status;
    if (countSize && countSize !== 'All') query.countSize = countSize;
    if (from || to) {
      query.dateFrozen = {};
      if (from) query.dateFrozen.$gte = new Date(from);
      if (to) query.dateFrozen.$lte = new Date(to + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [batches, total] = await Promise.all([
      FreezingBatch.find(query)
        .populate('warehouse', 'name')
        .populate('createdBy', 'name')
        .sort({ dateFrozen: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FreezingBatch.countDocuments(query),
    ]);

    res.json({ success: true, data: batches, total });
  } catch (err) {
    next(err);
  }
};

// GET /api/freezing-batches/:id
const getBatch = async (req, res, next) => {
  try {
    const batch = await FreezingBatch.findOne({ _id: req.params.id, company: req.companyId })
      .populate('warehouse', 'name')
      .populate('createdBy', 'name');
    if (!batch) return res.status(404).json({ success: false, message: 'Freezing batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
};

// POST /api/freezing-batches
const createBatch = async (req, res, next) => {
  try {
    const { dateFrozen, datePacked, quantityKgs, countSize, warehouseId, location, notes } = req.body;

    const company = await Company.findById(req.companyId);
    const warehouse = await Warehouse.findOne({ _id: warehouseId, company: req.companyId });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found.' });

    const batchNumber = await generateBatchNumber(company);

    const batch = await FreezingBatch.create({
      batchNumber,
      dateFrozen,
      datePacked,
      quantityKgs,
      countSize,
      warehouse: warehouseId,
      location,
      status: datePacked ? 'packed' : 'frozen',
      remainingKgs: quantityKgs,
      notes,
      company: req.companyId,
      createdBy: req.user._id,
    });

    const populated = await FreezingBatch.findById(batch._id)
      .populate('warehouse', 'name')
      .populate('createdBy', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/freezing-batches/:id
const updateBatch = async (req, res, next) => {
  try {
    const { datePacked, location, notes, status } = req.body;
    const batch = await FreezingBatch.findOne({ _id: req.params.id, company: req.companyId });
    if (!batch) return res.status(404).json({ success: false, message: 'Freezing batch not found.' });

    if (datePacked !== undefined) batch.datePacked = datePacked;
    if (location !== undefined) batch.location = location;
    if (notes !== undefined) batch.notes = notes;
    if (status !== undefined) batch.status = status;

    // Auto-update status based on datePacked
    if (datePacked && !status) {
      batch.status = 'packed';
    }

    await batch.save();

    const populated = await FreezingBatch.findById(batch._id)
      .populate('warehouse', 'name')
      .populate('createdBy', 'name');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/freezing-batches/:id
const deleteBatch = async (req, res, next) => {
  try {
    const batch = await FreezingBatch.findOne({ _id: req.params.id, company: req.companyId });
    if (!batch) return res.status(404).json({ success: false, message: 'Freezing batch not found.' });

    // Only allow deletion if batch is not partially used
    if (batch.remainingKgs < batch.quantityKgs) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete batch that has been partially used. Mark as exhausted instead.' 
      });
    }

    await FreezingBatch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Freezing batch deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/freezing-batches/available/:countSize
const getAvailableBatches = async (req, res, next) => {
  try {
    const { countSize } = req.params;
    const query = { 
      company: req.companyId, 
      countSize,
      remainingKgs: { $gt: 0 },
      status: { $in: ['frozen', 'packed', 'partial'] }
    };

    const batches = await FreezingBatch.find(query)
      .populate('warehouse', 'name')
      .sort({ dateFrozen: -1 });

    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getBatches, 
  getBatch, 
  createBatch, 
  updateBatch, 
  deleteBatch,
  getAvailableBatches 
};
