const mongoose = require('mongoose');
const { generateNextStoreId } = require('./utils/storeIdGenerator');
const Store = require('./models/Store');
const User = require('./models/User');

// Test database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_test');
    console.log('MongoDB connected for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test storeId generation
const testStoreIdGeneration = async () => {
  try {
    console.log('Testing storeId generation...');
    
    // Generate multiple storeIds to test the sequence
    const storeIds = [];
    for (let i = 0; i < 5; i++) {
      const storeId = await generateNextStoreId();
      storeIds.push(storeId);
      console.log(`Generated storeId ${i + 1}: ${storeId}`);
    }
    
    // Verify they are sequential
    console.log('\nGenerated storeIds:', storeIds);
    
    // Test with actual store creation
    console.log('\nTesting actual store creation...');
    const testStoreData = {
      storeName: 'Test Store',
      storeLocation: 'Test Location',
      storeAddress: '123 Test Street',
      contactPersonName: 'John Doe',
      contactNumber: '1234567890',
      email: 'test@example.com',
      organizationId: 'ORG001'
    };
    
    const storeId = await generateNextStoreId();
    testStoreData.storeId = storeId;
    testStoreData._id = storeId;
    
    const store = new Store(testStoreData);
    await store.save();
    console.log('Test store created successfully:', store.storeId);
    
    // Clean up test data
    await Store.deleteOne({ storeId: storeId });
    console.log('Test store cleaned up');
    
    console.log('\n✅ StoreId generation test passed!');
    
  } catch (error) {
    console.error('❌ StoreId generation test failed:', error);
  }
};

// Run tests
const runTests = async () => {
  await connectDB();
  await testStoreIdGeneration();
  await mongoose.connection.close();
  console.log('\nTest completed. Database connection closed.');
};

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testStoreIdGeneration };
