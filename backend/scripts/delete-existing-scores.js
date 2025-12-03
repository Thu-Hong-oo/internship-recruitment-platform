require('dotenv').config();
const mongoose = require('mongoose');
const CVMatchingScore = require('../src/models/CVMatchingScore');

async function deleteExistingScores() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const result = await CVMatchingScore.deleteMany({});
    
    console.log(`🗑️  Deleted ${result.deletedCount} existing CVMatchingScore records\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

deleteExistingScores();
