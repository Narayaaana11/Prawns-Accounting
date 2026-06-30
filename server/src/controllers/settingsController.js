const Company = require('../models/Company');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const StockAdjustment = require('../models/StockAdjustment');
const FreezingBatch = require('../models/FreezingBatch');

// GET /api/settings/company
const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.companyId);
    res.json({ success: true, data: company });
  } catch (err) { next(err); }
};

// PUT /api/settings/company
const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.companyId, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: company });
  } catch (err) { next(err); }
};

// GET /api/settings/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ company: req.companyId }).select('-password').sort({ createdAt: 1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// POST /api/settings/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });
    const user = await User.create({ name, email, password, role, phone, company: req.companyId });
    const safe = { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, isActive: user.isActive };
    res.status(201).json({ success: true, data: safe });
  } catch (err) { next(err); }
};

// PUT /api/settings/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, role, phone, isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company: req.companyId },
      { name, role, phone, isActive },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/settings/profile  (current user)
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/settings/load-demo
const loadDemoData = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const userId = req.user._id;
    const now = new Date();

    // Clear existing company data first to prevent duplicate key or messy dashboard
    await Promise.all([
      Product.deleteMany({ company: companyId }),
      Customer.deleteMany({ company: companyId }),
      Invoice.deleteMany({ company: companyId }),
      Expense.deleteMany({ company: companyId }),
      Warehouse.deleteMany({ company: companyId }),
      Inventory.deleteMany({ company: companyId }),
      StockAdjustment.deleteMany({ company: companyId }),
      FreezingBatch.deleteMany({ company: companyId }),
    ]);

    // Create Warehouses
    const warehouse1 = await Warehouse.create({
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: '12, Fish Market Road',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      manager: req.user.name,
      phone: req.user.phone || '9876543210',
      capacity: 500,
      status: 'Active',
      isDefault: true,
      company: companyId,
    });

    const warehouse2 = await Warehouse.create({
      name: 'Branch Store',
      code: 'WH-BRNCH',
      address: '45, Market Street',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      manager: req.user.name,
      phone: req.user.phone || '9876543210',
      capacity: 200,
      status: 'Active',
      isDefault: false,
      company: companyId,
    });

    // Seed Freezing Batches
    await FreezingBatch.create([
      {
        batchNumber: 'FB-0001',
        dateFrozen: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
        datePacked: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        quantityKgs: 1200,
        countSize: '40 count',
        warehouse: warehouse1._id,
        location: 'Chamber A-3',
        status: 'packed',
        remainingKgs: 0,
        notes: 'Excellent quality Vannamei crop from local farm',
        company: companyId,
        createdBy: userId,
      },
      {
        batchNumber: 'FB-0002',
        dateFrozen: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        quantityKgs: 850,
        countSize: '60 count',
        warehouse: warehouse1._id,
        location: 'Chamber B-1',
        status: 'frozen',
        remainingKgs: 850,
        notes: 'Regular batch from Coastal Prawns',
        company: companyId,
        createdBy: userId,
      },
      {
        batchNumber: 'FB-0003',
        dateFrozen: new Date(now.getFullYear(), now.getMonth() - 1, 15), // Last month
        quantityKgs: 1500,
        countSize: '80 count',
        warehouse: warehouse2._id,
        location: 'Chamber C-2',
        status: 'partial',
        remainingKgs: 500,
        notes: 'Seeded historical batch',
        company: companyId,
        createdBy: userId,
      }
    ]);
    
    // Set batchCounter for the company
    await Company.findByIdAndUpdate(companyId, { batchCounter: 4 });

    // Create Products (only Prawn Intake Lots)
    const productsData = [
      { name: 'White Prawns 100 count', brand: 'Bay Seafood', category: 'White Prawns', countSize: '100 count', weight: 50, price: 500, purchasePrice: 420, stock: 120, lowStockThreshold: 20, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
      { name: 'Vannamei Raw Prawns 120 count', brand: 'Premium Prawns', category: 'Vannamei Prawns', countSize: '120 count', weight: 25, price: 400, purchasePrice: 340, stock: 85, lowStockThreshold: 20, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
      { name: 'Scampi Prawns 100 count', brand: 'Ocean Harvest', category: 'Scampi Prawns', countSize: '100 count', weight: 10, price: 520, purchasePrice: 440, stock: 60, lowStockThreshold: 15, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6) },
      { name: 'Vannamei Raw Prawns 40 count', brand: 'Aqua Farms', category: 'Vannamei Prawns', countSize: '40 count', weight: 25, price: 450, purchasePrice: 380, stock: 150, lowStockThreshold: 20, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
      { name: 'Tiger Prawns 60 count', brand: 'Coastal Prawns', category: 'Tiger Prawns', countSize: '60 count', weight: 20, price: 650, purchasePrice: 550, stock: 80, lowStockThreshold: 15, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5) },
      { name: 'Scampi Prawns 80 count', brand: 'Marine Fresh', category: 'Scampi Prawns', countSize: '80 count', weight: 15, price: 550, purchasePrice: 460, stock: 60, lowStockThreshold: 10, intakeDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10) },
    ];

    const products = await Product.insertMany(productsData.map((p) => ({ ...p, company: companyId })));

    // Create Inventory entries for both warehouses
    for (const p of products) {
      await Inventory.create({
        product: p._id,
        warehouse: warehouse1._id,
        quantity: p.stock,
        company: companyId,
      });
      await Inventory.create({
        product: p._id,
        warehouse: warehouse2._id,
        quantity: 0,
        company: companyId,
      });
    }

    // Create Customers
    const customersData = [
      { name: 'Ravi Kumar Fisheries', phone: '9812345678', email: 'ravi@ravifisheries.com', city: 'Vijayawada', type: 'Wholesale', creditLimit: 100000, outstandingBalance: 21300 },
      { name: 'Meena Fisheries', phone: '9823456789', email: 'meena@meenafisheries.com', city: 'Guntur', type: 'Retail', creditLimit: 50000, outstandingBalance: 8750 },
      { name: 'Ganesh Aqua', phone: '9845678901', city: 'Tenali', type: 'Farm', creditLimit: 75000, outstandingBalance: 5600 },
      { name: 'Padma Fish Farm', phone: '9856789012', city: 'Eluru', type: 'Farm', creditLimit: 60000, outstandingBalance: 0 },
    ];

    const customers = await Customer.insertMany(customersData.map((c) => ({ ...c, company: companyId })));

    // Create historical Invoices (using relative months based on current time)
    const company = await Company.findById(companyId);
    const companyShort = companyId.toString().slice(-4).toUpperCase();
    const prefix = company?.invoicePrefix || 'INV';

    const invoices = [];
    const monthlyTargets = [45000, 52000, 61000, 78000, 93000, 85000]; // 6 months of data

    let invCounter = 1;
    for (let i = 5; i >= 0; i--) {
      const monthOffset = i;
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
      const targetAmount = monthlyTargets[5 - i];
      let accumulated = 0;

      while (accumulated < targetAmount) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 8) + 2;
        const lineTotal = qty * product.price;
        const subtotal = lineTotal;
        const gstAmount = Math.round(subtotal * 0.05);
        const total = subtotal + gstAmount;
        const paymentType = Math.random() > 0.4 ? 'Cash' : 'Credit';
        const status = paymentType === 'Credit' ? 'Credit' : 'Paid';

        // Add a random offset for the day
        const dayOffset = Math.floor(Math.random() * 25) + 1;
        const invDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), dayOffset);

        invoices.push({
          invoiceNumber: `${prefix}-${companyShort}-${String(invCounter++).padStart(4, '0')}`,
          customer: customer._id,
          customerName: customer.name,
          items: [
            { product: product._id, productName: product.name, quantity: qty, unitPrice: product.price, lineTotal },
          ],
          subtotal,
          gstRate: 5,
          gstAmount,
          total,
          paidAmount: status === 'Paid' ? total : 0,
          paymentType,
          status,
          company: companyId,
          createdBy: userId,
          createdAt: invDate,
          updatedAt: invDate,
        });

        accumulated += total;
      }
    }

    await Invoice.insertMany(invoices);

    // Create Expenses
    const expenseCategories = ['Transport', 'Staff Salary', 'Packaging', 'Rent', 'Electricity'];
    const expensesData = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 15);
      for (const cat of expenseCategories) {
        const baseAmounts = { Transport: 5000, 'Staff Salary': 15000, Packaging: 3000, Rent: 10000, Electricity: 4000 };
        const amount = Math.round((baseAmounts[cat] || 4000) * (0.9 + Math.random() * 0.2));
        const dayOffset = Math.floor(Math.random() * 25) + 1;
        const expDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), dayOffset);

        expensesData.push({
          category: cat,
          amount,
          description: `${cat} overhead`,
          date: expDate,
          paymentMethod: 'UPI',
          status: 'Approved',
          submittedBy: userId,
          approvedBy: userId,
          company: companyId,
        });
      }
    }

    await Expense.insertMany(expensesData);

    res.json({ success: true, message: 'Demo data loaded successfully!' });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/clear-data
const clearCompanyData = async (req, res, next) => {
  try {
    const { password } = req.body;
    const companyId = req.companyId;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to clear workspace data.' });
    }

    // Load user with password field to verify
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User verification failed.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Clear action aborted.' });
    }

    await Promise.all([
      Product.deleteMany({ company: companyId }),
      Customer.deleteMany({ company: companyId }),
      Invoice.deleteMany({ company: companyId }),
      Expense.deleteMany({ company: companyId }),
      Warehouse.deleteMany({ company: companyId }),
      Inventory.deleteMany({ company: companyId }),
      StockAdjustment.deleteMany({ company: companyId }),
      FreezingBatch.deleteMany({ company: companyId }),
    ]);

    res.json({ success: true, message: 'All workspace data cleared successfully!' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCompany, updateCompany, getUsers, createUser, updateUser, updateProfile, loadDemoData, clearCompanyData };
