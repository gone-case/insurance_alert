require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test data
    console.log('Cleaning database...');
    await Promise.all([
      User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL || 'admin@insurance.com' } }),
      Lead.deleteMany({}),
      Renewal.deleteMany({}),
    ]);

    // 1. Ensure Admin exists
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@insurance.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Tejasvini',
        email: process.env.ADMIN_EMAIL || 'admin@insurance.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
        phone: '9876543210',
      });
      console.log('✅ Admin created:', admin.email);
    } else {
      console.log('ℹ️ Admin already exists');
    }

    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);
    const in10Days = new Date(today); in10Days.setDate(today.getDate() + 10);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);

    // 2. Create Specific Test Agent (8340867831)
    const agentPhone = '8340867831';
    let testAgent = await User.findOne({ phone: agentPhone });
    if (!testAgent) {
      testAgent = await User.create({
        name: 'Agent Rahul',
        email: 'agent834@insurance.com',
        password: 'Agent@123',
        role: 'agent',
        phone: agentPhone,
      });
      console.log('✅ Test Agent created:', testAgent.email);
    }

    // 3. Add Sample Data for Admin
    await Lead.create([
      {
        customerName: 'Sanjay Dutt',
        phoneNumber: '9123456780',
        policyNumber: 'LP-ADM-01',
        interestedPolicyType: 'Health',
        tentativePurchaseDate: tomorrow,
        premiumAmount: 18000,
        notes: 'Admin lead - urgent follow up',
        status: 'Interested',
        createdBy: admin._id,
      }
    ]);

    await Renewal.create([
      {
        customerName: 'Amitabh Bachchan',
        phoneNumber: '9123456781',
        policyNumber: 'RP-ADM-01',
        policyType: 'Life',
        renewalDueDate: in3Days,
        lastPremiumPaid: 50000,
        renewalStatus: 'Pending',
        createdBy: admin._id,
      }
    ]);
    console.log('✅ Sample data for Admin created');

    // 4. Add Sample Data for Test Agent (8340867831)
    await Lead.create([
      {
        customerName: 'Aman Verma',
        phoneNumber: '9876500001',
        policyNumber: 'LP-AG-8341',
        interestedPolicyType: 'Health',
        tentativePurchaseDate: tomorrow,
        premiumAmount: 20000,
        notes: 'Wants top-up cover',
        status: 'Pending',
        createdBy: testAgent._id,
      },
      {
        customerName: 'Priya Singh',
        phoneNumber: '9876500002',
        policyNumber: 'LP-AG-8342',
        interestedPolicyType: 'Motor',
        tentativePurchaseDate: in10Days,
        premiumAmount: 12000,
        notes: 'New car delivery next week',
        status: 'Interested',
        createdBy: testAgent._id,
      },
      {
        customerName: 'Kunal Kapoor',
        phoneNumber: '9876500005',
        policyNumber: 'LP-AG-8343',
        interestedPolicyType: 'Term',
        tentativePurchaseDate: tomorrow,
        premiumAmount: 25000,
        notes: 'In progress - awaiting documents',
        status: 'Pending',
        createdBy: testAgent._id,
      }
    ]);

    await Renewal.create([
      {
        customerName: 'Rajesh Khanna',
        phoneNumber: '9876500003',
        policyNumber: 'RP-AG-8341',
        policyType: 'Life',
        renewalDueDate: in3Days,
        lastPremiumPaid: 30000,
        renewalStatus: 'Pending',
        notes: 'Annual premium due',
        createdBy: testAgent._id,
      },
      {
        customerName: 'Sonia Gandhi',
        phoneNumber: '9876500004',
        policyNumber: 'RP-AG-8342',
        policyType: 'Health',
        renewalDueDate: lastWeek,
        lastPremiumPaid: 15000,
        renewalStatus: 'Expired',
        notes: 'Grace period ending soon',
        createdBy: testAgent._id,
      }
    ]);
    console.log('✅ Sample data for Test Agent created');

    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();