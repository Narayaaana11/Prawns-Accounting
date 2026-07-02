const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');
const { emitProductUpdate, emitInventoryUpdate, emitLowStockAlert } = require('../utils/websocket');

// GET /api/inventory
const getInventory = async (req, res, next) => {
  try {
    const { search, stockStatus } = req.query;
    const query = { company: req.companyId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }
    if (stockStatus === 'low_stock') {
      query.$expr = { $lt: ['$stock', '$lowStockThreshold'] };
    } else if (stockStatus === 'out_of_stock') {
      query.stock = 0;
    }

    const products = await Product.find(query).sort({ stock: 1 });

    const enriched = products.map((p) => ({
      ...p.toObject(),
      stockStatus: p.stock <= 0 ? 'out_of_stock'
        : p.stock < p.lowStockThreshold / 2 ? 'critical'
        : p.stock < p.lowStockThreshold ? 'low_stock'
        : 'in_stock',
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/adjustments
const getAdjustments = async (req, res, next) => {
  try {
    const { productId, page = 1, limit = 50 } = req.query;
    const query = { company: req.companyId };
    if (productId) query.product = productId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [adjustments, total] = await Promise.all([
      StockAdjustment.find(query)
        .populate('product', 'name brand')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StockAdjustment.countDocuments(query),
    ]);

    res.json({ success: true, data: adjustments, total });
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory/adjust
const adjustInventory = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    const product = await Product.findOne({ _id: productId, company: req.companyId });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'add') {
      newStock = previousStock + Math.abs(quantity);
    } else if (type === 'remove') {
      newStock = Math.max(0, previousStock - Math.abs(quantity));
    } else if (type === 'adjustment') {
      newStock = Math.max(0, quantity);
    }

    product.stock = newStock;
    await product.save();

    const adjustment = await StockAdjustment.create({
      product: product._id,
      type,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      reason,
      createdBy: req.user._id,
      company: req.companyId,
    });

    await adjustment.populate('product', 'name brand');
    await adjustment.populate('createdBy', 'name');

    // Emit WebSocket events
    const io = req.app.locals.io;
    if (io) {
      emitProductUpdate(io, req.companyId, product);
      emitInventoryUpdate(io, req.companyId, { productId });

      // Check for low stock products
      if (newStock < product.lowStockThreshold) {
        const lowStockProducts = await Product.find({
          company: req.companyId,
          isActive: true,
          $expr: { $lt: ['$stock', '$lowStockThreshold'] },
        });
        emitLowStockAlert(io, req.companyId, lowStockProducts);
      }
    }

    res.json({ success: true, data: { product, adjustment } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventory, getAdjustments, adjustInventory };
