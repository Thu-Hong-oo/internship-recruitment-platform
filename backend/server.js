const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const PORT = process.env.PORT;

const dotenv = require('dotenv').config();
//Database Connecttion
const ConnectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    await mongoose.connect(mongoUri);
    console.log('Database Connected Successfully');
  } catch (error) {
    console.error('Database Connected Successfully');
    process.exit(1);
  }
}
//connect to database
ConnectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});