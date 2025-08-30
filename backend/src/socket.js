

const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { logger } = require('./utils/logger');

const setupSocket = (server) => {
  const { Server } = require('socket.io');
  //khởi tạo socket io dựa trên http server
  const io = new Server(server, {
    cors: {//bật cor để client có thể kết nối từ domain khác
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
//gắn các thông tin cần thiết lên socket để event khác dùng
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.fullName;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userName} (${socket.userId})`, { 
      socketId: socket.id,
      userRole: socket.userRole 
    });

    // Join user to personal room
    socket.join(`user:${socket.userId}`);
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Handle job-related events
    socket.on('join-job', (jobId) => {
      socket.join(`job:${jobId}`);
      logger.info(`User ${socket.userId} joined job room: ${jobId}`);
    });

    socket.on('leave-job', (jobId) => {
      socket.leave(`job:${jobId}`);
      logger.info(`User ${socket.userId} left job room: ${jobId}`);
    });

    // Handle application events
    socket.on('join-application', (applicationId) => {
      socket.join(`application:${applicationId}`);
      logger.info(`User ${socket.userId} joined application room: ${applicationId}`);
    });

    socket.on('application-status-update', (data) => {
      const { applicationId, status, message } = data;
      
      // Broadcast to application room
      socket.to(`application:${applicationId}`).emit('application-status-changed', {
        applicationId,
        status,
        message,
        timestamp: new Date(),
        updatedBy: {
          id: socket.userId,
          name: socket.userName,
          role: socket.userRole
        }
      });

      logger.info(`Application status updated: ${applicationId} -> ${status}`, {
        userId: socket.userId
      });
    });

    // Handle interview events
    socket.on('interview-scheduled', (data) => {
      const { applicationId, interviewData, applicantId, employerId } = data;
      
      // Notify applicant
      if (applicantId) {
        io.to(`user:${applicantId}`).emit('interview-notification', {
          type: 'scheduled',
          applicationId,
          interviewData,
          message: 'You have a new interview scheduled'
        });
      }

      // Notify employer
      if (employerId) {
        io.to(`user:${employerId}`).emit('interview-notification', {
          type: 'scheduled',
          applicationId,
          interviewData,
          message: 'Interview has been scheduled'
        });
      }

      logger.info(`Interview scheduled for application: ${applicationId}`);
    });

    // Handle chat/messaging
    socket.on('join-chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      logger.info(`User ${socket.userId} joined chat: ${chatId}`);
    });

    socket.on('send-message', (data) => {
      const { chatId, message, recipientId } = data;
      
      const messageData = {
        chatId,
        message,
        sender: {
          id: socket.userId,
          name: socket.userName,
          role: socket.userRole
        },
        timestamp: new Date()
      };

      // Send to chat room
      socket.to(`chat:${chatId}`).emit('new-message', messageData);
      
      // Send to specific recipient if provided
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('new-message', messageData);
      }

      logger.info(`Message sent in chat: ${chatId}`, { userId: socket.userId });
    });

    socket.on('typing-start', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        chatId
      });
    });

    socket.on('typing-stop', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        chatId
      });
    });

    // Handle AI analysis progress
    socket.on('start-cv-analysis', (data) => {
      const { filename } = data;
      
      // Emit progress updates (simulated)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
          
          socket.emit('cv-analysis-complete', {
            filename,
            status: 'completed'
          });
        } else {
          socket.emit('cv-analysis-progress', {
            filename,
            progress: Math.round(progress),
            status: 'processing'
          });
        }
      }, 1000);

      // Store interval ID to clean up if user disconnects
      socket.progressInterval = progressInterval;
    });

    // Handle job recommendation requests
    socket.on('request-job-recommendations', async (data) => {
      try {
        socket.emit('recommendation-progress', {
          status: 'started',
          message: 'Analyzing your profile...'
        });

        // Simulate AI processing with progress updates
        setTimeout(() => {
          socket.emit('recommendation-progress', {
            status: 'processing',
            progress: 50,
            message: 'Matching with available jobs...'
          });
        }, 1000);

        setTimeout(() => {
          socket.emit('recommendation-progress', {
            status: 'completing',
            progress: 90,
            message: 'Generating recommendations...'
          });
        }, 2000);

        setTimeout(() => {
          socket.emit('recommendations-ready', {
            status: 'completed',
            message: 'Job recommendations are ready!',
            count: Math.floor(Math.random() * 10) + 1
          });
        }, 3000);

      } catch (error) {
        socket.emit('recommendation-error', {
          error: 'Failed to generate recommendations'
        });
      }
    });

    // Handle notifications
    socket.on('mark-notification-read', (notificationId) => {
      // Broadcast to admin if needed
      io.to('role:admin').emit('notification-read', {
        notificationId,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle real-time job updates
    socket.on('job-updated', (jobData) => {
      if (socket.userRole === 'employer' || socket.userRole === 'admin') {
        // Broadcast to all users interested in jobs
        socket.broadcast.emit('job-list-updated', {
          jobId: jobData.jobId,
          action: jobData.action, // 'created', 'updated', 'deleted'
          timestamp: new Date()
        });
      }
    });

    // Handle user presence
    socket.on('user-online', () => {
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        userName: socket.userName,
        status: 'online',
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userName} (${socket.userId})`, { 
        reason,
        socketId: socket.id 
      });

      // Clean up any running intervals
      if (socket.progressInterval) {
        clearInterval(socket.progressInterval);
      }

      // Broadcast user offline status
      socket.broadcast.emit('user-status-changed', {
        userId: socket.userId,
        userName: socket.userName,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error, { 
        userId: socket.userId,
        socketId: socket.id 
      });
    });
  });

  // Global events for system-wide notifications
  const broadcastToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };

  const broadcastToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const broadcastToAll = (event, data) => {
    io.emit(event, data);
  };

  // Attach broadcast functions to io object for use in other parts of the app
  io.broadcastToRole = broadcastToRole;
  io.broadcastToUser = broadcastToUser;
  io.broadcastToAll = broadcastToAll;



  return io;
};

module.exports = { setupSocket };



