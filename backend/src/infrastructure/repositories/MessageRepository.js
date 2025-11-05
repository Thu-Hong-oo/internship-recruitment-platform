const Message = require('../models/Message');

/**
 * MessageRepository
 * Infrastructure layer repository for Message entity
 */
class MessageRepository {
  async findById(id) {
    return await Message.findById(id);
  }

  async findByConversation(conversationId) {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async findBySender(senderId) {
    return await Message.find({ senderId });
  }

  async findAll() {
    return await Message.find();
  }

  async create(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  async update(id, messageData) {
    return await Message.findByIdAndUpdate(id, messageData, { new: true });
  }

  async delete(id) {
    return await Message.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await Message.find({ _id: { $in: ids } });
  }

  async markAsRead(id) {
    return await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async markAllAsRead(conversationId, userId) {
    return await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { isRead: true }
    );
  }

  async countUnreadByConversation(conversationId, userId) {
    return await Message.countDocuments({
      conversationId,
      senderId: { $ne: userId },
      isRead: false,
    });
  }
}

module.exports = MessageRepository;
