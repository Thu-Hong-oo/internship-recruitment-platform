const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log types
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), {
  flags: 'a',
});

const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), {
  flags: 'a',
});

// Custom token for request ID
morgan.token('reqId', req => req.id || 'unknown');

// Custom token for response time in ms
morgan.token('responseTime', (req, res) => {
  if (!req._startTime || !res._responseTime) {
    return '-';
  }
  return `${res._responseTime - req._startTime}ms`;
});

// Custom token for user ID
morgan.token('userId', req => req.user?.id || 'anonymous');

// Custom token for IP address
morgan.token('ip', req => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
});

// Custom format for access logs
const accessLogFormat =
  ':reqId :userId :ip :method :url :status :responseTime :res[content-length] :referrer :user-agent';

// Custom format for error logs
const errorLogFormat = ':reqId :userId :ip :method :url :status :responseTime';

// Access logger
const accessLogger = morgan(accessLogFormat, {
  stream: accessLogStream,
  skip: (req, res) => {
    // Skip logging for health checks and static files
    return req.url === '/health' || req.url.startsWith('/static');
  },
});

// Error logger
const errorLogger = morgan(errorLogFormat, {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400,
});

// Console logger for development
const consoleLogger = morgan('combined', {
  skip: (req, res) => process.env.NODE_ENV === 'production',
});

// Request ID middleware
const requestId = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  req._startTime = Date.now();
  next();
};

// Response time middleware
const responseTime = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    res._responseTime = Date.now();
  });

  next();
};

// Log rotation (daily)
const rotateLogs = () => {
  const today = new Date().toISOString().split('T')[0];
  const accessLogPath = path.join(logsDir, 'access.log');
  const errorLogPath = path.join(logsDir, 'error.log');

  // Check if log file exists and is older than today
  if (fs.existsSync(accessLogPath)) {
    const stats = fs.statSync(accessLogPath);
    const logDate = stats.mtime.toISOString().split('T')[0];

    if (logDate !== today) {
      // Rotate access log
      fs.renameSync(accessLogPath, path.join(logsDir, `access-${logDate}.log`));
    }
  }

  if (fs.existsSync(errorLogPath)) {
    const stats = fs.statSync(errorLogPath);
    const logDate = stats.mtime.toISOString().split('T')[0];

    if (logDate !== today) {
      // Rotate error log
      fs.renameSync(errorLogPath, path.join(logsDir, `error-${logDate}.log`));
    }
  }
};

// Schedule log rotation (run daily at midnight)
setInterval(rotateLogs, 24 * 60 * 60 * 1000);

module.exports = {
  accessLogger,
  errorLogger,
  consoleLogger,
  requestId,
  responseTime,
  rotateLogs,
};
