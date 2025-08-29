// ===== test-connection.js =====
// Simple script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB connection...');
console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');
console.log('🌐 Cluster name:', process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1]?.split('.')[0] : 'Unknown');

// Test basic connectivity first
const clusterName = process.env.MONGODB_URI?.split('@')[1]?.split('.')[0];
if (clusterName) {
  console.log(`🔍 Testing DNS resolution for: ${clusterName}.qxujakd.mongodb.net`);
  
  const dns = require('dns');
  dns.lookup(`${clusterName}.qxujakd.mongodb.net`, (err, address, family) => {
    if (err) {
      console.error('❌ DNS lookup failed:', err.message);
      console.error('💡 This suggests the cluster name is incorrect or the cluster is not accessible');
    } else {
      console.log('✅ DNS lookup successful:', address);
      console.log('🌐 Family:', family);
      
      // Now test MongoDB connection
      testMongoConnection();
    }
  });
} else {
  console.error('❌ MONGODB_URI not found in .env file');
}

function testMongoConnection() {
  console.log('\n🔌 Testing MongoDB connection...');
  
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔍 Error code:', error.code);
    
    if (error.code === 'ETIMEOUT') {
      console.error('\n💡 ETIMEOUT means DNS resolution timeout. Possible solutions:');
      console.error('   1. Check if the cluster name is correct');
      console.error('   2. Verify the cluster exists and is running');
      console.error('   3. Check your internet connection');
      console.error('   4. Ensure your IP is whitelisted in MongoDB Atlas');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 ENOTFOUND means the cluster name cannot be resolved. Check:');
      console.error('   1. Cluster name spelling');
      console.error('   2. If the cluster still exists');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 ECONNREFUSED means connection was refused. Check:');
      console.error('   1. If the cluster is running');
      console.error('   2. If your IP is whitelisted');
      console.error('   3. If the cluster is accessible');
    }
  });
}
