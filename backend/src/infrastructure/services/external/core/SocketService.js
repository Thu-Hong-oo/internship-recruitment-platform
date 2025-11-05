const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const JWTService = require('./JWTService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = JWTService.verifyAccessToken(token);
        socket.userId = decoded.id || decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', socket => {
      console.log(`User ${socket.userId} connected`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      socket.emit('connected', { userId: socket.userId });

      // Handle joining rooms
      socket.on('join-room', roomId => {
        this.joinRoom(socket.userId, roomId);
        socket.join(roomId);
        socket.emit('joined-room', { roomId });
      });

      // Handle leaving rooms
      socket.on('leave-room', roomId => {
        this.leaveRoom(socket.userId, roomId);
        socket.leave(roomId);
        socket.emit('left-room', { roomId });
      });

      // Handle chat messages
      socket.on('send-message', async data => {
        try {
          const { conversationId, content, type = 'text' } = data;

          // Save message to database
          const Message = require('../models/Message');
          const message = new Message({
            conversationId,
            senderId: socket.userId,
            content,
            type,
            sentAt: new Date(),
          });

          await message.save();

          // Broadcast to conversation room
          socket.to(conversationId).emit('new-message', {
            id: message._id,
            conversationId,
            senderId: socket.userId,
            content,
            type,
            sentAt: message.sentAt,
          });

          socket.emit('message-sent', { messageId: message._id });
        } catch (error) {
          socket.emit('message-error', { error: error.message });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', data => {
        socket.to(data.conversationId).emit('user-typing', {
          userId: socket.userId,
          conversationId: data.conversationId,
          isTyping: true,
        });
      });

      socket.on('typing-stop', data => {
        socket.to(data.conversationId).emit('user-typing', {
          userId: socket.userId,
          conversationId: data.conversationId,
          isTyping: false,
        });
      });

      // Handle message read status
      socket.on('mark-message-read', async data => {
        try {
          const { messageId } = data;
          const Message = require('../models/Message');

          await Message.findByIdAndUpdate(messageId, {
            $addToSet: { readBy: socket.userId },
          });

          socket.emit('message-read', { messageId });
        } catch (error) {
          socket.emit('read-error', { error: error.message });
        }
      });

      // Handle notifications
      socket.on('mark-notification-read', async data => {
        try {
          const { notificationId } = data;
          const { Notification } = require('../domains/notification');

          await Notification.findByIdAndUpdate(notificationId, {
            isRead: true,
          });

          socket.emit('notification-read', { notificationId });
        } catch (error) {
          socket.emit('notification-error', { error: error.message });
        }
      });

      // Handle application status updates
      socket.on('application-status-update', data => {
        const { candidateId, applicationId, status } = data;

        // Notify candidate about status update
        this.sendToUser(candidateId, 'application-status-updated', {
          applicationId,
          status,
          updatedAt: new Date(),
        });
      });

      // Handle job updates
      socket.on('job-update', data => {
        const { jobId, type, data: updateData } = data;

        // Notify all users following this job
        this.sendToRoom(`job-${jobId}`, 'job-updated', {
          jobId,
          type,
          data: updateData,
          updatedAt: new Date(),
        });
      });

      // Handle user status updates
      socket.on('user-status-update', data => {
        const { userId, status } = data;

        this.sendToUser(userId, 'status-updated', {
          status,
          updatedAt: new Date(),
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userRooms.delete(socket.userId);
      });
    });
  }

  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  sendToAll(event, data) {
    this.io.emit(event, data);
  }

  sendToRole(role, event, data) {
    // This would require storing user roles in memory or database
    // For now, we'll broadcast to all connected users
    this.io.emit(event, data);
  }

  joinRoom(userId, roomId) {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(roomId);
  }

  leaveRoom(userId, roomId) {
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId).delete(roomId);
    }
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getUserRooms(userId) {
    return this.userRooms.get(userId) || new Set();
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectionCount() {
    return this.connectedUsers.size;
  }

  // Application-specific methods
  async notifyApplicationStatus(applicationId, candidateId, status) {
    this.sendToUser(candidateId, 'application-status-updated', {
      applicationId,
      status,
      updatedAt: new Date(),
    });
  }

  async notifyNewApplication(employerId, application) {
    this.sendToUser(employerId, 'new-application', {
      applicationId: application._id,
      candidateName: application.candidateName,
      jobTitle: application.jobTitle,
      appliedAt: application.appliedAt,
    });
  }

  async notifyJobMatch(candidateId, job) {
    this.sendToUser(candidateId, 'job-match', {
      jobId: job._id,
      title: job.title,
      companyName: job.companyName,
      matchScore: job.matchScore,
    });
  }

  async notifyInterviewInvitation(candidateId, interview) {
    this.sendToUser(candidateId, 'interview-invitation', {
      interviewId: interview._id,
      jobTitle: interview.jobTitle,
      companyName: interview.companyName,
      date: interview.date,
      time: interview.time,
    });
  }

  async notifySystemMaintenance(message) {
    this.sendToAll('system-maintenance', {
      message,
      scheduledAt: new Date(),
    });
  }

  async notifyNewJobPosting(candidateIds, job) {
    candidateIds.forEach(candidateId => {
      this.sendToUser(candidateId, 'new-job-posting', {
        jobId: job._id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
      });
    });
  }

  async notifyProfileUpdate(userId, updateType) {
    this.sendToUser(userId, 'profile-updated', {
      updateType,
      updatedAt: new Date(),
    });
  }

  async notifySkillRecommendation(candidateId, skills) {
    this.sendToUser(candidateId, 'skill-recommendation', {
      skills,
      recommendedAt: new Date(),
    });
  }

  async notifyLearningProgress(candidateId, progress) {
    this.sendToUser(candidateId, 'learning-progress', {
      progress,
      updatedAt: new Date(),
    });
  }

  // Admin methods
  async broadcastSystemMessage(message, type = 'info') {
    this.sendToAll('system-message', {
      message,
      type,
      timestamp: new Date(),
    });
  }

  async notifyAdmins(event, data) {
    // This would require filtering by admin role
    this.sendToRole('admin', event, data);
  }

  async getSystemStats() {
    return {
      connectedUsers: this.getConnectionCount(),
      activeRooms: this.userRooms.size,
      uptime: process.uptime(),
    };
  }
}

module.exports = new SocketService();
