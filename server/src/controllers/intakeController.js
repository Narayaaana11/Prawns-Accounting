const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const StockAdjustment = require('../models/StockAdjustment');
// Assuming Expense model is required if paymentMethod is Cash?
// For now we will just use Supplier balance. If cash, we don't add to balance.

// POST /api/intake
const createIntake = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { farmerName, paymentMethod, countValue, weight, amountPerKg } = req.body;
    const companyId = req.companyId;

    if (!farmerName || !countValue || !weight || weight <= 0 || !amountPerKg || amountPerKg < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Missing or invalid fields.' });
    }

    // 1. Find or create the Supplier (Farmer)
    let supplier = await Supplier.findOne({ name: { $regex: new RegExp(`^${farmerName}$`, 'i') }, company: companyId }).session(session);
    if (!supplier) {
      supplier = await Supplier.create([{
        name: farmerName,
        paymentTerms: paymentMethod === 'Credit' ? 'Net30' : 'Cash',
        company: companyId,
      }], { session });
      supplier = supplier[0];
    }

    // 2. Find or create the Product for this specific count size
    // We treat all vannamei prawns of the same count as the same inventory item.
    let product = await Product.findOne({ countSize: countValue, category: 'Vannamei Prawns', company: companyId }).session(session);
    
    if (!product) {
      product = await Product.create([{
        name: `Vannamei Prawns ${countValue}`,
        brand: 'Multiple Farmers',
        category: 'Vannamei Prawns',
        countSize: countValue,
        weight: weight, // initial weight setting, not highly relevant if stock is used
        price: amountPerKg, // initial sale price estimation
        purchasePrice: amountPerKg,
        stock: 0,
        company: companyId,
      }], { session });
      product = product[0];
    }

    const prevStock = product.stock;
    product.stock += weight;
    product.purchasePrice = amountPerKg; // Update to latest price
    await product.save({ session });

    // 3. Log Stock Adjustment
    await StockAdjustment.create([{
      product: product._id,
      type: 'add',
      quantity: weight,
      previousStock: prevStock,
      newStock: product.stock,
      reason: `Intake from ${farmerName}`,
      reference: 'Prawns Intake',
      createdBy: req.user._id,
      company: companyId,
    }], { session });

    // 4. Create a Purchase Order (Intake Record)
    const totalAmount = weight * amountPerKg;
    const poCount = await PurchaseOrder.countDocuments({ company: companyId }).session(session);
    const poNumber = `IN-${String(poCount + 1).padStart(4, '0')}`;

    const po = await PurchaseOrder.create([{
      poNumber: poNumber,
      supplier: supplier._id,
      supplierName: supplier.name,
      items: [{
        product: product._id,
        productName: product.name,
        quantity: weight,
        unitCost: amountPerKg,
        lineTotal: totalAmount,
      }],
      subtotal: totalAmount,
      totalAmount: totalAmount,
      status: 'Received', // automatically received
      expectedDate: new Date(),
      receivedDate: new Date(),
      notes: `Payment: ${paymentMethod}`,
      createdBy: req.user._id,
      receivedBy: req.user._id,
      company: companyId,
    }], { session });

    // 5. Update Supplier Balance if Credit
    if (paymentMethod === 'Credit') {
      supplier.outstandingBalance += totalAmount;
      await supplier.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // WebSocket notification
    const io = req.app.locals.io;
    if (io) {
      io.to(`company_${companyId}`).emit('inventory_update', { event: 'prawn_intake' });
      if (paymentMethod === 'Credit') {
        io.to(`company_${companyId}`).emit('supplier_updated', supplier);
      }
    }

    res.status(201).json({ success: true, message: 'Intake recorded successfully', data: po[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// DELETE /api/intake/:id
const deleteIntake = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    const po = await PurchaseOrder.findOne({ _id: id, company: companyId }).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    if (po.status === 'Cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Intake is already cancelled' });
    }

    // 1. Reverse Supplier Balance if Credit
    if (po.notes && po.notes.includes('Payment: Credit')) {
      const supplier = await Supplier.findById(po.supplier).session(session);
      if (supplier) {
        supplier.outstandingBalance -= po.totalAmount;
        await supplier.save({ session });
      }
    }

    // 2. Reverse Stock
    for (const item of po.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        const prevStock = product.stock;
        product.stock -= item.quantity;
        await product.save({ session });

        await StockAdjustment.create([{
          product: product._id,
          type: 'remove',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: product.stock,
          reason: `Intake Reversal / Deletion - ${po.poNumber}`,
          reference: po.poNumber,
          createdBy: req.user._id,
          company: companyId,
        }], { session });
      }
    }

    po.status = 'Cancelled';
    await po.save({ session });

    await session.commitTransaction();
    session.endSession();

    // WebSocket notification
    const io = req.app.locals.io;
    if (io) {
      io.to(`company_${companyId}`).emit('inventory_update', { event: 'prawn_intake_deleted' });
      if (po.notes && po.notes.includes('Payment: Credit')) {
        const supplier = await Supplier.findById(po.supplier);
        if(supplier) io.to(`company_${companyId}`).emit('supplier_updated', supplier);
      }
    }

    res.json({ success: true, message: 'Intake cancelled successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// PUT /api/intake/:id
const updateIntake = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { farmerName, paymentMethod, countValue, weight, amountPerKg } = req.body;
    const companyId = req.companyId;

    if (!farmerName || !countValue || !weight || weight <= 0 || !amountPerKg || amountPerKg < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Missing or invalid fields.' });
    }

    const po = await PurchaseOrder.findOne({ _id: id, company: companyId }).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Intake not found' });
    }

    if (po.status === 'Cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled intake' });
    }

    // 1. REVERSE OLD INTAKE
    if (po.notes && po.notes.includes('Payment: Credit')) {
      const oldSupplier = await Supplier.findById(po.supplier).session(session);
      if (oldSupplier) {
        oldSupplier.outstandingBalance -= po.totalAmount;
        await oldSupplier.save({ session });
      }
    }

    for (const item of po.items) {
      const oldProduct = await Product.findById(item.product).session(session);
      if (oldProduct) {
        const prevStock = oldProduct.stock;
        oldProduct.stock -= item.quantity;
        await oldProduct.save({ session });

        await StockAdjustment.create([{
          product: oldProduct._id,
          type: 'remove',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: oldProduct.stock,
          reason: `Intake Edit Reversal - ${po.poNumber}`,
          reference: po.poNumber,
          createdBy: req.user._id,
          company: companyId,
        }], { session });
      }
    }

    // 2. APPLY NEW INTAKE
    let supplier = await Supplier.findOne({ name: { $regex: new RegExp(`^${farmerName}$`, 'i') }, company: companyId }).session(session);
    if (!supplier) {
      supplier = await Supplier.create([{
        name: farmerName,
        paymentTerms: paymentMethod === 'Credit' ? 'Net30' : 'Cash',
        company: companyId,
      }], { session });
      supplier = supplier[0];
    }

    let product = await Product.findOne({ countSize: countValue, category: 'Vannamei Prawns', company: companyId }).session(session);
    if (!product) {
      product = await Product.create([{
        name: `Vannamei Prawns ${countValue}`,
        brand: 'Multiple Farmers',
        category: 'Vannamei Prawns',
        countSize: countValue,
        weight: weight,
        price: amountPerKg,
        purchasePrice: amountPerKg,
        stock: 0,
        company: companyId,
      }], { session });
      product = product[0];
    }

    const prevStock = product.stock;
    product.stock += weight;
    product.purchasePrice = amountPerKg;
    await product.save({ session });

    await StockAdjustment.create([{
      product: product._id,
      type: 'add',
      quantity: weight,
      previousStock: prevStock,
      newStock: product.stock,
      reason: `Intake Edit Addition - ${po.poNumber}`,
      reference: po.poNumber,
      createdBy: req.user._id,
      company: companyId,
    }], { session });

    const totalAmount = weight * amountPerKg;

    po.supplier = supplier._id;
    po.supplierName = supplier.name;
    po.items = [{
      product: product._id,
      productName: product.name,
      quantity: weight,
      unitCost: amountPerKg,
      lineTotal: totalAmount,
    }];
    po.subtotal = totalAmount;
    po.totalAmount = totalAmount;
    po.notes = `Payment: ${paymentMethod}`;
    await po.save({ session });

    if (paymentMethod === 'Credit') {
      supplier.outstandingBalance += totalAmount;
      await supplier.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const io = req.app.locals.io;
    if (io) {
      io.to(`company_${companyId}`).emit('inventory_update', { event: 'prawn_intake_edited' });
      io.to(`company_${companyId}`).emit('supplier_updated', supplier);
    }

    res.json({ success: true, message: 'Intake updated successfully', data: po });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = { createIntake, deleteIntake, updateIntake };
