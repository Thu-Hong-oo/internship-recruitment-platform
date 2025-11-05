/**
 * Chat Application Use Cases Index
 * Exports all chat-related use cases for real-time communication
 */

const CreateConversationUseCase = require('./use-cases/CreateConversationUseCase');
const SendMessageUseCase = require('./use-cases/SendMessageUseCase');
const GetConversationsUseCase = require('./use-cases/GetConversationsUseCase');
const GetMessagesUseCase = require('./use-cases/GetMessagesUseCase');
const MarkMessagesAsReadUseCase = require('./use-cases/MarkMessagesAsReadUseCase');

module.exports = {
  // Conversation Management
  CreateConversationUseCase,
  GetConversationsUseCase,

  // Message Management
  SendMessageUseCase,
  GetMessagesUseCase,
  MarkMessagesAsReadUseCase,
};

/**
 * Chat Domain Overview:
 *
 * This domain handles real-time communication between platform users,
 * supporting both candidate-employer conversations and peer-to-peer chat.
 *
 * Key Features:
 * - Real-time messaging with WebSocket support
 * - Conversation management with participant handling
 * - Message read status and delivery tracking
 * - File attachments and rich media support
 * - Message threading and replies
 * - Conversation search and filtering
 * - Notification integration
 * - Typing indicators and presence
 *
 * Use Cases:
 * 1. CreateConversationUseCase - Initialize conversations between users
 * 2. SendMessageUseCase - Send messages with real-time delivery
 * 3. GetConversationsUseCase - List user conversations with metadata
 * 4. GetMessagesUseCase - Retrieve conversation messages with threading
 * 5. MarkMessagesAsReadUseCase - Update read status and unread counts
 *
 * Integration Points:
 * - Notification system for message alerts
 * - User management for participant validation
 * - File upload services for attachments
 * - WebSocket service for real-time updates
 * - Job context linking for recruitment conversations
 */
