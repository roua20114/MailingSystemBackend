require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../modules/users/user.model');
const Department = require('../modules/departments/department.model');
const MailCategory = require('../modules/settings/mailCategory.model');
const MailType = require('../modules/settings/mailType.model');
const SystemConfig = require('../modules/settings/systemConfig.model');
const Mail = require('../modules/mail/mail.model');

const config = require('../config');
const logger = require('../utils/logger');

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      MailCategory.deleteMany({}),
      MailType.deleteMany({}),
      SystemConfig.deleteMany({}),
      Mail.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // ── System Config ────────────────────────────────────────────────────────
    await SystemConfig.create({
      institutionName: 'National University of Technology',
      logoUrl: null,
      globalTimeout: 30,
      allowSelfRegistration: false,
    });
    logger.info('✅ System config created');

    // ── Mail Types ───────────────────────────────────────────────────────────
    const mailTypes = await MailType.insertMany([
      { name: 'Incoming', description: 'Mail received from external parties' },
      { name: 'Outgoing', description: 'Mail sent to external parties' },
      { name: 'Internal', description: 'Mail exchanged within the institution' },
    ]);
    logger.info('✅ Mail types created');

    // ── Mail Categories ──────────────────────────────────────────────────────
    const categories = await MailCategory.insertMany([
      { name: 'Administrative', maxProcessingTime: 7, description: 'Administrative correspondence' },
      { name: 'Financial', maxProcessingTime: 5, description: 'Financial and accounting matters' },
      { name: 'Legal', maxProcessingTime: 3, description: 'Legal and compliance matters' },
      { name: 'Academic', maxProcessingTime: 10, description: 'Academic correspondence and requests' },
      { name: 'HR', maxProcessingTime: 5, description: 'Human resources related mail' },
      { name: 'Technical', maxProcessingTime: 14, description: 'IT and technical requests' },
      { name: 'General', maxProcessingTime: 15, description: 'General correspondence' },
    ]);
    logger.info('✅ Mail categories created');

    // ── Departments ──────────────────────────────────────────────────────────
    const depts = await Department.insertMany([
      { name: 'Presidency', description: 'University presidency office' },
      { name: 'Human Resources', description: 'HR and personnel management' },
      { name: 'Finance & Accounting', description: 'Financial operations and budgeting' },
      { name: 'Academic Affairs', description: 'Academic programs and faculty' },
      { name: 'IT & Systems', description: 'Information technology and systems' },
      { name: 'Legal Affairs', description: 'Legal and compliance' },
      { name: 'Student Services', description: 'Student support and enrollment' },
    ]);
    logger.info('✅ Departments created');

    const deptMap = {};
    depts.forEach((d) => { deptMap[d.name] = d._id; });

    // ── Users ────────────────────────────────────────────────────────────────
    const seededUsers = [
      {
        name: config.admin.name,
        email: config.admin.email,
        password: config.admin.password,
        role: 'Admin',
        departmentId: deptMap['Presidency'],
      },
      {
        name: 'Dr. Ahmed Mansour',
        email: 'director@nexusmail.com',
        password: 'Director@123',
        role: 'Director',
        departmentId: deptMap['Presidency'],
      },
      {
        name: 'Sara El-Amin',
        email: 'secretary@nexusmail.com',
        password: 'Secretary@123',
        role: 'Secretary',
        departmentId: deptMap['Academic Affairs'],
      },
      {
        name: 'Prof. Khalid Ibrahim',
        email: 'professor@nexusmail.com',
        password: 'Professor@123',
        role: 'Professor',
        departmentId: deptMap['Academic Affairs'],
      },
      {
        name: 'Hana Ben Ali',
        email: 'servicelead@nexusmail.com',
        password: 'ServiceLead@123',
        role: 'Service Lead',
        departmentId: deptMap['Human Resources'],
      },
      {
        name: 'Omar Tarek',
        email: 'staff@nexusmail.com',
        password: 'Staff@123456',
        role: 'Professor',
        departmentId: deptMap['IT & Systems'],
      },
    ];

    const users = [];
    for (const userData of seededUsers) {
      users.push(await User.create(userData));
    }
    logger.info('✅ Users created');

    const userMap = {};
    users.forEach((u) => { userMap[u.email] = u._id; });

    // Update department heads
    await Department.findByIdAndUpdate(deptMap['Human Resources'], {
      headUserId: userMap['servicelead@nexusmail.com'],
    });

    // ── Sample Mails ─────────────────────────────────────────────────────────
    const now = new Date();
    const addDays = (d, n) => new Date(new Date(d).setDate(d.getDate() + n));

    await Mail.insertMany([
      {
        subject: 'Request for Budget Approval - Q1 2025',
        sender: 'Ministry of Education',
        type: 'Incoming',
        category: categories[1]._id, // Financial
        priority: 'High',
        status: 'Registered',
        createdBy: userMap['secretary@nexusmail.com'],
        description: 'Official request from Ministry of Education for budget allocation review.',
        aiSummary:
          'This correspondence from Ministry of Education concerns budget approval for Q1 2025. The matter requires prompt attention from the Finance department.',
        aiSuggestedDepartment: 'Finance & Accounting',
        aiConfidenceScore: 0.87,
        slaDeadline: addDays(now, 5),
        statusHistory: [
          {
            status: 'Registered',
            changedBy: userMap['secretary@nexusmail.com'],
            changedAt: now,
            note: 'Mail registered',
          },
        ],
      },
      {
        subject: 'Annual Staff Performance Review Procedure',
        sender: 'HR Department - Central Office',
        type: 'Internal',
        category: categories[4]._id, // HR
        priority: 'Medium',
        status: 'Under Review',
        createdBy: userMap['secretary@nexusmail.com'],
        assignedDepartment: deptMap['Human Resources'],
        description: 'Annual circular regarding the staff performance review process and timeline.',
        aiSummary:
          'Internal circular from HR Central Office outlining the annual staff performance review procedures. Routing to Human Resources is recommended.',
        aiSuggestedDepartment: 'Human Resources',
        aiConfidenceScore: 0.91,
        slaDeadline: addDays(now, 3),
        statusHistory: [
          {
            status: 'Registered',
            changedBy: userMap['secretary@nexusmail.com'],
            changedAt: addDays(now, -2),
            note: 'Mail registered',
          },
          {
            status: 'Under Review',
            changedBy: userMap['director@nexusmail.com'],
            changedAt: addDays(now, -1),
            note: 'Taken under review by Director',
          },
        ],
      },
      {
        subject: 'IT Infrastructure Upgrade Proposal',
        sender: 'TechCorp Solutions',
        type: 'Incoming',
        category: categories[5]._id, // Technical
        priority: 'Low',
        status: 'Assigned',
        createdBy: userMap['secretary@nexusmail.com'],
        assignedTo: userMap['staff@nexusmail.com'],
        assignedDepartment: deptMap['IT & Systems'],
        instructions:
          'Please review this vendor proposal thoroughly and prepare a technical evaluation report within 10 business days.',
        description: 'Vendor proposal for upgrading the university network infrastructure.',
        aiSummary:
          'Proposal from TechCorp Solutions for university IT infrastructure upgrade. Technical evaluation by IT department is recommended.',
        aiSuggestedDepartment: 'IT & Systems',
        aiConfidenceScore: 0.94,
        slaDeadline: addDays(now, 10),
        statusHistory: [
          {
            status: 'Registered',
            changedBy: userMap['secretary@nexusmail.com'],
            changedAt: addDays(now, -5),
          },
          {
            status: 'Under Review',
            changedBy: userMap['director@nexusmail.com'],
            changedAt: addDays(now, -4),
          },
          {
            status: 'Assigned',
            changedBy: userMap['director@nexusmail.com'],
            changedAt: addDays(now, -3),
            note: 'Assigned to IT staff for evaluation',
          },
        ],
      },
      {
        subject: 'Student Scholarship Application - Batch 2025',
        sender: 'National Scholarship Board',
        type: 'Incoming',
        category: categories[3]._id, // Academic
        priority: 'Urgent',
        status: 'In Progress',
        createdBy: userMap['secretary@nexusmail.com'],
        assignedTo: userMap['professor@nexusmail.com'],
        assignedDepartment: deptMap['Academic Affairs'],
        instructions:
          'Compile list of eligible students meeting scholarship criteria and submit to the Scholarship Board by end of month.',
        description: 'National scholarship board requesting eligible student nominations.',
        aiSummary:
          'Urgent request from the National Scholarship Board for 2025 batch student nominations. Academic Affairs should process and compile the eligibility list.',
        aiSuggestedDepartment: 'Academic Affairs',
        aiConfidenceScore: 0.89,
        slaDeadline: addDays(now, 2),
        statusHistory: [
          { status: 'Registered', changedBy: userMap['secretary@nexusmail.com'], changedAt: addDays(now, -7) },
          { status: 'Under Review', changedBy: userMap['director@nexusmail.com'], changedAt: addDays(now, -6) },
          { status: 'Assigned', changedBy: userMap['director@nexusmail.com'], changedAt: addDays(now, -5) },
          {
            status: 'In Progress',
            changedBy: userMap['professor@nexusmail.com'],
            changedAt: addDays(now, -4),
            note: 'Started compiling eligible students list',
          },
        ],
      },
      {
        subject: 'Annual Financial Audit Report Submission',
        sender: 'External Audit Committee',
        type: 'Incoming',
        category: categories[1]._id, // Financial
        priority: 'High',
        status: 'Processed',
        createdBy: userMap['secretary@nexusmail.com'],
        assignedTo: userMap['servicelead@nexusmail.com'],
        assignedDepartment: deptMap['Finance & Accounting'],
        instructions: 'Review audit findings and prepare management response for board presentation.',
        description: 'Annual financial audit results with recommendations.',
        aiSummary:
          'Annual audit report from External Audit Committee submitted for review and management response. Finance department action required.',
        aiSuggestedDepartment: 'Finance & Accounting',
        aiConfidenceScore: 0.92,
        slaDeadline: addDays(now, -2),
        isOverdue: false,
        statusHistory: [
          { status: 'Registered', changedBy: userMap['secretary@nexusmail.com'], changedAt: addDays(now, -20) },
          { status: 'Under Review', changedBy: userMap['director@nexusmail.com'], changedAt: addDays(now, -18) },
          { status: 'Assigned', changedBy: userMap['director@nexusmail.com'], changedAt: addDays(now, -15) },
          { status: 'In Progress', changedBy: userMap['servicelead@nexusmail.com'], changedAt: addDays(now, -10) },
          { status: 'Processed', changedBy: userMap['servicelead@nexusmail.com'], changedAt: addDays(now, -3), note: 'Audit response submitted' },
        ],
      },
    ]);
    logger.info('✅ Sample mails created');

    logger.info('\n🎉 Database seeded successfully!\n');
    logger.info('─────────────────────────────────────────────');
    logger.info('  Test Credentials:');
    logger.info(`  Admin      → ${config.admin.email}   / Admin@123456`);
    logger.info('  Director   → director@nexusmail.com   / Director@123');
    logger.info('  Secretary  → secretary@nexusmail.com  / Secretary@123');
    logger.info('  Professor  → professor@nexusmail.com  / Professor@123');
    logger.info('  ServiceLead→ servicelead@nexusmail.com/ ServiceLead@123');
    logger.info('─────────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
