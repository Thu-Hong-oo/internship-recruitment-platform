const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(__dirname));

// Serve test HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-google-oauth.html'));
});

// CORS for Google OAuth
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  next();
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} to test Google OAuth`);
});
