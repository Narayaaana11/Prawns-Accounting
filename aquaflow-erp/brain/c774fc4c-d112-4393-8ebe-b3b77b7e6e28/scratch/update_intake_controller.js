const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../../server/src/controllers/intakeController.js');
let code = fs.readFileSync(controllerPath, 'utf8');

const newCode = `

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
          reason: \`Intake Reversal / Deletion - \${po.poNumber}\`,
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
      io.to(\`company_\${companyId}\`).emit('inventory_update', { event: 'prawn_intake_deleted' });
      if (po.notes && po.notes.includes('Payment: Credit')) {
        const supplier = await Supplier.findById(po.supplier);
        if(supplier) io.to(\`company_\${companyId}\`).emit('supplier_updated', supplier);
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
          reason: \`Intake Edit Reversal - \${po.poNumber}\`,
          reference: po.poNumber,
          createdBy: req.user._id,
          company: companyId,
        }], { session });
      }
    }

    // 2. APPLY NEW INTAKE
    let supplier = await Supplier.findOne({ name: { $regex: new RegExp(\`^\${farmerName}\$\`, 'i') }, company: companyId }).session(session);
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
        name: \`Vannamei Prawns \${countValue}\`,
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
      reason: \`Intake Edit Addition - \${po.poNumber}\`,
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
    po.notes = \`Payment: \${paymentMethod}\`;
    await po.save({ session });

    if (paymentMethod === 'Credit') {
      supplier.outstandingBalance += totalAmount;
      await supplier.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const io = req.app.locals.io;
    if (io) {
      io.to(\`company_\${companyId}\`).emit('inventory_update', { event: 'prawn_intake_edited' });
      io.to(\`company_\${companyId}\`).emit('supplier_updated', supplier);
    }

    res.json({ success: true, message: 'Intake updated successfully', data: po });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = { createIntake, deleteIntake, updateIntake };
`;

code = code.replace('module.exports = { createIntake };', newCode);
fs.writeFileSync(controllerPath, code);
console.log('intakeController.js updated successfully!');
