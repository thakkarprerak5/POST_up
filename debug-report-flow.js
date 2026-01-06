// Debug script to test report creation and check admin visibility
const testReportFlow = async () => {
  console.log('🔍 Testing Report Flow...\n');

  try {
    // Test 1: Create a test report as a regular user
    console.log('📝 Creating test report...');
    
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');

    const Report = require('./models/Report').default;
    const User = require('./models/User').default;

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@student.com' });
    if (!testUser) {
      testUser = new User({
        fullName: 'Test Student',
        email: 'test@student.com',
        type: 'student',
        password: 'test123'
      });
      await testUser.save();
      console.log('✅ Created test student user');
    }

    // Find or create a test reported user
    let reportedUser = await User.findOne({ email: 'reported@student.com' });
    if (!reportedUser) {
      reportedUser = new User({
        fullName: 'Reported Student',
        email: 'reported@student.com',
        type: 'student',
        password: 'test123'
      });
      await reportedUser.save();
      console.log('✅ Created reported student user');
    }

    // Create a test report
    const testReport = new Report({
      reporterId: testUser._id.toString(),
      reporterName: testUser.fullName,
      reporterEmail: testUser.email,
      reportedUserId: reportedUser._id.toString(),
      targetType: 'comment',
      targetId: 'test-comment-123',
      targetDetails: {
        title: 'Test Comment',
        content: 'This is a test comment that should be reported',
        authorName: reportedUser.fullName
      },
      reason: 'inappropriate_content',
      description: 'This comment contains inappropriate content and should be reviewed',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await testReport.save();
    console.log('✅ Created test report:', testReport._id);

    // Test 2: Check if admin can see the report
    console.log('\n👮 Testing admin visibility...');
    
    // Find admin user
    let adminUser = await User.findOne({ type: 'super_admin' });
    if (!adminUser) {
      adminUser = new User({
        fullName: 'Test Admin',
        email: 'admin@test.com',
        type: 'super_admin',
        password: 'admin123'
      });
      await adminUser.save();
      console.log('✅ Created test admin user');
    }

    // Check what reports the admin can see
    const adminReports = await Report.getReports({
      page: 1,
      limit: 20
    });

    console.log(`📊 Admin can see ${adminReports.length} reports:`);
    adminReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.targetType} - ${report.reason} - ${report.status}`);
      console.log(`     Target: ${report.targetDetails?.title || 'N/A'}`);
      console.log(`     Description: ${report.description}`);
      console.log(`     Reporter: ${report.reporterName}`);
    });

    // Test 3: Check if filtering works
    console.log('\n🔍 Testing filters...');
    
    const commentReports = await Report.getReports({
      targetType: 'comment',
      page: 1,
      limit: 20
    });

    console.log(`💬 Comment reports: ${commentReports.length}`);
    const pendingReports = await Report.getReports({
      status: 'pending',
      page: 1,
      limit: 20
    });
    console.log(`⏳ Pending reports: ${pendingReports.length}`);

    // Test 4: Check database directly
    console.log('\n🗄️ Checking database directly...');
    const allReports = await Report.find({});
    console.log(`📈 Total reports in database: ${allReports.length}`);

    await mongoose.disconnect();
    
    console.log('\n✅ Test completed!');
    console.log('\n🔧 Debugging Tips:');
    console.log('1. Check if admin user is properly authenticated in admin panel');
    console.log('2. Verify API /api/admin/reports is returning correct data');
    console.log('3. Check browser network tab for API responses');
    console.log('4. Verify ReportsPage is properly rendering the data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

testReportFlow();
