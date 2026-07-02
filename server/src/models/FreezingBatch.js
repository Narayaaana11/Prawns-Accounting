const mongoose = require('mongoose');

const freezingBatchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dateFrozen: {
      type: Date,
      required: [true, 'Date frozen is required'],
    },
    datePacked: {
      type: Date,
    },
    quantityKgs: {
      type: Number,
      required: [true, 'Quantity in kgs is required'],
      min: [0.1, 'Quantity must be greater than 0'],
    },
    countSize: {
      type: String,
      required: [true, 'Count size is required'],
      trim: true,
      enum: ['40 count', '60 count', '80 count', '100 count', '120 count', 'Other'],
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['frozen', 'packed', 'partial', 'exhausted'],
      default: 'frozen',
    },
    remainingKgs: {
      type: Number,
      required: true,
      min: [0, 'Remaining kgs cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for fast company-scoped queries
freezingBatchSchema.index({ company: 1, batchNumber: 1 }, { unique: true });
freezingBatchSchema.index({ company: 1, status: 1 });
freezingBatchSchema.index({ company: 1, dateFrozen: -1 });
freezingBatchSchema.index({ company: 1, countSize: 1 });

// Virtual: percentage used
freezingBatchSchema.virtual('percentageUsed').get(function () {
  if (this.quantityKgs === 0) return 0;
  return ((this.quantityKgs - this.remainingKgs) / this.quantityKgs) * 100;
});

// Virtual: is exhausted
freezingBatchSchema.virtual('isExhausted').get(function () {
  return this.remainingKgs <= 0;
});

module.exports = mongoose.model('FreezingBatch', freezingBatchSchema);
