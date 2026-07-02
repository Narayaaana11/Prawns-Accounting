require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Company = require('./models/Company');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Expense = require('./models/Expense');
const StockAdjustment = require('./models/StockAdjustment');
const Supplier = require('./models/Supplier');
const PurchaseOrder = require('./models/PurchaseOrder');
const CreditNote = require('./models/CreditNote');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  // Clear existing data
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Invoice.deleteMany({}),
    Expense.deleteMany({}),
    StockAdjustment.deleteMany({}),
    Supplier.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    CreditNote.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // Create Company
  const company = await Company.create({
    name: 'AquaFarm Co.',
    ownerName: 'Rajesh Sharma',
    phone: '9876543210',
    email: 'admin@aquafarm.co',
    address: '12, Fish Market Road, Bypass',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    pincode: '520001',
    gstNumber: '37AABCU9603R1ZM',
    gstRate: 5,
    invoicePrefix: 'INV',
    invoiceCounter: 42,
  });
  console.log('✅ Company created');

  // Create Users
  const owner = await User.create({
    name: 'Rajesh Sharma',
    email: 'admin@aquafarm.co',
    password: 'admin123',
    role: 'Owner',
    company: company._id,
    phone: '9876543210',
  });

  const manager = await User.create({
    name: 'Priya Nair',
    email: 'manager@aquafarm.co',
    password: 'staff123',
    role: 'Manager',
    company: company._id,
    phone: '9876500001',
  });

  const salesStaff = await User.create({
    name: 'Kiran Babu',
    email: 'sales@aquafarm.co',
    password: 'staff123',
    role: 'Sales Staff',
    company: company._id,
    phone: '9876500002',
  });

  const accountant = await User.create({
    name: 'Meena Devi',
    email: 'accounts@aquafarm.co',
    password: 'staff123',
    role: 'Accountant',
    company: company._id,
    phone: '9876500003',
  });
  console.log('✅ Users created');

  // Create Products
  const productsData = [
    { name: 'Vannamei Raw Prawns 40 count', brand: 'Aqua Farms', category: 'Vannamei Prawns', countSize: '40 count', weight: 25, price: 450, purchasePrice: 380, stock: 120, lowStockThreshold: 20 },
    { name: 'Vannamei Raw Prawns 60 count', brand: 'Coastal Prawns', category: 'Vannamei Prawns', countSize: '60 count', weight: 25, price: 400, purchasePrice: 340, stock: 85, lowStockThreshold: 20 },
    { name: 'Vannamei Raw Prawns 80 count', brand: 'Marine Fresh', category: 'Vannamei Prawns', countSize: '80 count', weight: 25, price: 350, purchasePrice: 300, stock: 15, lowStockThreshold: 15 },
    { name: 'Tiger Prawns 40 count', brand: 'Bay Seafood', category: 'Tiger Prawns', countSize: '40 count', weight: 20, price: 750, purchasePrice: 650, stock: 43, lowStockThreshold: 20 },
    { name: 'Tiger Prawns 60 count', brand: 'Coastal Prawns', category: 'Tiger Prawns', countSize: '60 count', weight: 20, price: 650, purchasePrice: 550, stock: 12, lowStockThreshold: 15 },
    { name: 'Tiger Prawns 100 count', brand: 'Ocean Harvest', category: 'Tiger Prawns', countSize: '100 count', weight: 20, price: 550, purchasePrice: 470, stock: 67, lowStockThreshold: 20 },
    { name: 'Scampi Prawns 60 count', brand: 'Marine Fresh', category: 'Scampi Prawns', countSize: '60 count', weight: 15, price: 600, purchasePrice: 500, stock: 9, lowStockThreshold: 15 },
    { name: 'Scampi Prawns 80 count', brand: 'Marine Fresh', category: 'Scampi Prawns', countSize: '80 count', weight: 15, price: 550, purchasePrice: 460, stock: 32, lowStockThreshold: 20 },
    { name: 'White Prawns 80 count', brand: 'Bay Seafood', category: 'White Prawns', countSize: '80 count', weight: 30, price: 580, purchasePrice: 490, stock: 28, lowStockThreshold: 15 },
    { name: 'White Prawns 100 count', brand: 'Bay Seafood', category: 'White Prawns', countSize: '100 count', weight: 30, price: 500, purchasePrice: 420, stock: 55, lowStockThreshold: 10 },
  ];

  const products = await Product.insertMany(productsData.map((p) => ({ ...p, company: company._id })));
  console.log(`✅ ${products.length} products created`);

  // Create Suppliers
  const suppliersData = [
    { name: 'Royal Fish Feeds Inc.', contactPerson: 'Srinivas Rao', phone: '9848012345', email: 'srinivas@royalfeeds.com', address: 'Plot 24, Industrial Area', city: 'Vijayawada', state: 'Andhra Pradesh', gstNumber: '37AABCR1234F1Z1', paymentTerms: 'Net30', outstandingBalance: 45000 },
    { name: 'Apex Biotech Feed', contactPerson: 'Dr. John Mathew', phone: '9866054321', email: 'info@apexbiotech.com', address: 'Sector 3, APIIC Zone', city: 'Kakinada', state: 'Andhra Pradesh', gstNumber: '37AAICA5678B2Z2', paymentTerms: 'Net15', outstandingBalance: 0 },
    { name: 'Coastal Feed Milling', contactPerson: 'Balu G.', phone: '9849098765', email: 'balu@coastalfeed.com', address: 'Near Port Area', city: 'Visakhapatnam', state: 'Andhra Pradesh', gstNumber: '37AAFCF9012C3Z3', paymentTerms: 'Cash', outstandingBalance: 12000 },
  ];

  const suppliers = await Supplier.insertMany(suppliersData.map((s) => ({ ...s, company: company._id })));
  console.log(`✅ ${suppliers.length} suppliers created`);

  // Create Purchase Orders
  const po1Product1 = products[0];
  const po1Product2 = products[1];
  const po1qty1 = 50;
  const po1qty2 = 40;
  const cost1 = po1Product1.purchasePrice;
  const cost2 = po1Product2.purchasePrice;
  const line1Total = po1qty1 * cost1;
  const line2Total = po1qty2 * cost2;
  const subtotalPo1 = line1Total + line2Total;

  await PurchaseOrder.create({
    poNumber: 'PO-0001',
    supplier: suppliers[0]._id,
    supplierName: suppliers[0].name,
    items: [
      { product: po1Product1._id, productName: po1Product1.name, quantity: po1qty1, unitCost: cost1, lineTotal: line1Total },
      { product: po1Product2._id, productName: po1Product2.name, quantity: po1qty2, unitCost: cost2, lineTotal: line2Total }
    ],
    subtotal: subtotalPo1,
    totalAmount: subtotalPo1,
    status: 'Received',
    expectedDate: new Date(2026, 4, 15),
    receivedDate: new Date(2026, 4, 16),
    notes: 'Urgent stocking for seasonal demand',
    receivedBy: owner._id,
    createdBy: owner._id,
    company: company._id
  });

  const po2Product = products[2];
  const po2qty = 100;
  const cost3 = po2Product.purchasePrice;
  const line3Total = po2qty * cost3;
  const subtotalPo2 = line3Total;

  await PurchaseOrder.create({
    poNumber: 'PO-0002',
    supplier: suppliers[1]._id,
    supplierName: suppliers[1].name,
    items: [
      { product: po2Product._id, productName: po2Product.name, quantity: po2qty, unitCost: cost3, lineTotal: line3Total }
    ],
    subtotal: subtotalPo2,
    totalAmount: subtotalPo2,
    status: 'Ordered',
    expectedDate: new Date(2026, 6, 20),
    company: company._id
  });
  console.log('✅ Purchase Orders created');

  // Create Customers
  const customersData = [
    { name: 'Ravi Kumar Fisheries', phone: '9812345678', email: 'ravi@ravifisheries.com', city: 'Vijayawada', type: 'Wholesale', creditLimit: 100000, outstandingBalance: 21300 },
    { name: 'Meena Fisheries', phone: '9823456789', email: 'meena@meenafisheries.com', city: 'Guntur', type: 'Retail', creditLimit: 50000, outstandingBalance: 8750 },
    { name: 'Blue Waters Co.', phone: '9834567890', email: 'info@bluewaters.co', city: 'Nellore', type: 'Distributor', creditLimit: 200000, outstandingBalance: 0 },
    { name: 'Ganesh Aqua', phone: '9845678901', city: 'Tenali', type: 'Farm', creditLimit: 75000, outstandingBalance: 5600 },
    { name: 'Padma Fish Farm', phone: '9856789012', city: 'Eluru', type: 'Farm', creditLimit: 60000, outstandingBalance: 0 },
    { name: 'Srinivas Aquaculture', phone: '9867890123', email: 'srini@aqua.in', city: 'Kakinada', type: 'Wholesale', creditLimit: 150000, outstandingBalance: 45200 },
    { name: 'Delta Fish Traders', phone: '9878901234', city: 'Rajahmundry', type: 'Distributor', creditLimit: 300000, outstandingBalance: 0 },
    { name: 'Krishna Fish Farm', phone: '9889012345', city: 'Machilipatnam', type: 'Farm', creditLimit: 40000, outstandingBalance: 12000 },
  ];

  const customers = await Customer.insertMany(customersData.map((c) => ({ ...c, company: company._id })));
  console.log(`✅ ${customers.length} customers created`);

  // Create Invoices (historical data for reports)
  const months = [0, 1, 2, 3, 4, 5, 6]; // Jan-Jul 2026
  const salesAmounts = [42000, 58000, 51000, 67000, 73000, 89000, 95000];
  const invoices = [];

  let invCounter = 1;
  for (let mi = 0; mi < months.length; mi++) {
    const month = months[mi];
    const targetAmount = salesAmounts[mi];
    let accumulated = 0;

    while (accumulated < targetAmount) {
      const customer = customers[Math.floor(Math.random() * Math.min(5, customers.length))];
      const product1 = products[Math.floor(Math.random() * products.length)];
      const product2 = products[Math.floor(Math.random() * products.length)];
      const qty1 = Math.floor(Math.random() * 5) + 1;
      const qty2 = Math.floor(Math.random() * 3) + 1;
      const line1Total = qty1 * product1.price;
      const line2Total = qty2 * product2.price;
      const subtotal = line1Total + line2Total;
      const gstAmount = Math.round(subtotal * 0.05);
      const total = subtotal + gstAmount;
      const paymentTypes = ['Cash', 'UPI', 'Cheque', 'Credit'];
      const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
      const status = paymentType === 'Credit' ? 'Credit' : 'Paid';

      const invDate = new Date(2026, month, Math.floor(Math.random() * 25) + 1);
      invoices.push({
        invoiceNumber: `INV-${String(invCounter++).padStart(4, '0')}`,
        customer: customer._id,
        customerName: customer.name,
        items: [
          { product: product1._id, productName: product1.name, quantity: qty1, unitPrice: product1.price, lineTotal: line1Total },
          { product: product2._id, productName: product2.name, quantity: qty2, unitPrice: product2.price, lineTotal: line2Total },
        ],
        subtotal,
        gstRate: 5,
        gstAmount,
        total,
        paidAmount: status === 'Paid' ? total : 0,
        paymentType,
        status,
        company: company._id,
        createdBy: owner._id,
        createdAt: invDate,
        updatedAt: invDate,
      });
      accumulated += total;
    }
  }

  const createdInvoices = await Invoice.insertMany(invoices);
  console.log(`✅ ${createdInvoices.length} invoices created`);

  // Create Credit Notes
  if (createdInvoices.length > 0) {
    const targetInv = createdInvoices[0];
    const targetItem = targetInv.items[0];
    const cnQty = 1;
    const cnLineTotal = cnQty * targetItem.unitPrice;

    await CreditNote.create({
      creditNoteNumber: 'CN-0001',
      originalInvoice: targetInv._id,
      originalInvoiceNumber: targetInv.invoiceNumber,
      customer: targetInv.customer,
      customerName: targetInv.customerName,
      items: [
        { product: targetItem.product, productName: targetItem.productName, quantity: cnQty, unitPrice: targetItem.unitPrice, lineTotal: cnLineTotal }
      ],
      reason: 'Bags damaged during transport',
      totalAmount: cnLineTotal,
      status: 'Applied',
      createdBy: owner._id,
      company: company._id
    });
    console.log('✅ Credit Notes created');
  }

  // Update invoice counter
  await Company.findByIdAndUpdate(company._id, { invoiceCounter: invCounter });

  // Create Expenses
  const expenseCategories = ['Transport', 'Staff Salary', 'Packaging', 'Electricity', 'Rent', 'Repairs', 'Maintenance', 'Other'];
  const expensesData = [];
  for (let m = 0; m < 7; m++) {
    for (let i = 0; i < 6; i++) {
      const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amounts = { Transport: 8000, 'Staff Salary': 45000, Packaging: 5000, Electricity: 12000, Rent: 25000, Repairs: 7000, Maintenance: 6000, Other: 3000 };
      const base = amounts[cat] || 5000;
      expensesData.push({
        category: cat,
        amount: Math.round(base * (0.8 + Math.random() * 0.4)),
        description: `${cat} - ${new Date(2026, m, 1).toLocaleString('default', { month: 'long' })}`,
        date: new Date(2026, m, Math.floor(Math.random() * 25) + 1),
        paymentMethod: ['Cash', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 3)],
        status: 'Approved',
        submittedBy: owner._id,
        approvedBy: owner._id,
        company: company._id,
      });
    }
  }

  await Expense.insertMany(expensesData);
  console.log(`✅ ${expensesData.length} expenses created`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Owner:     admin@aquafarm.co  / admin123');
  console.log('  Manager:   manager@aquafarm.co / staff123');
  console.log('  Sales:     sales@aquafarm.co   / staff123');
  console.log('  Accounts:  accounts@aquafarm.co / staff123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
