const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const dotenv = require('dotenv').config();

const { setupSocket } = require('./src/socket');
const jobsRouter = require('./src/routes/jobs');
const { runOnce } = require('./src/crawler/orchestrator');

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

const PORT = process.env.PORT || 3000;

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI environment variable is not defined');
    await mongoose.connect(mongoUri);
    console.log('Database Connected Successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
}

connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('Intern Jobs API'));
app.use('/api/jobs', jobsRouter);

// Cron: chạy mỗi 15 phút
cron.schedule('*/15 * * * *', async () => {
  console.log('[cron] crawler runOnce');
  try { await runOnce(io); } catch (e) { console.error('cron runOnce error:', e.message); }
});

// Nút manual để chạy crawler 1 lần (debug)
app.post('/admin/crawler/run-once', async (req, res) => {
  try { await runOnce(io); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});