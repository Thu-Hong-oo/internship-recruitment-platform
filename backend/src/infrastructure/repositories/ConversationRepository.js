const ConversationModel = require('../models/Conversation');
const ConversationMapper = require('../mappers/ConversationMapper');

/**
 * ConversationRepository
 * Infrastructure layer repository for Conversation entity
 * Returns domain entities using ConversationMapper
 */
class ConversationRepository {
  /**
   * Find conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Conversation|null>} Domain entity or null
   */
  async findById(id) {
    const doc = await ConversationModel.findById(id);
    return ConversationMapper.toDomain(doc);
  }

  /**
   * Find all conversations where user is a participant
   * @param {string} userId - User ID
   * @returns {Promise<Array<Conversation>>} Array of domain entities
   */
  async findByParticipant(userId) {
    const docs = await ConversationModel.find({
      participants: userId,
    })
      .populate('participants', 'firstName lastName email avatar avatarUrl')
      .sort({ updatedAt: -1 });

    return ConversationMapper.toDomainArray(docs);
  }

  /**
   * Find direct conversation between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Conversation|null>} Domain entity or null
   */
  async findByParticipants(userId1, userId2) {
    const doc = await ConversationModel.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
      type: 'DIRECT',
    });

    return ConversationMapper.toDomain(doc);
  }

  /**
   * Find conversation by job and participants
   * @param {string} jobId - Job ID
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<Conversation|null>} Domain entity or null
   */
  async findByJobAndParticipants(jobId, userId1, userId2) {
    const doc = await ConversationModel.findOne({
      jobId,
      participants: { $all: [userId1, userId2] },
    });

    return ConversationMapper.toDomain(doc);
  }

  /**
   * Find conversation by application
   * @param {string} applicationId - Application ID
   * @returns {Promise<Conversation|null>} Domain entity or null
   */
  async findByApplication(applicationId) {
    const doc = await ConversationModel.findOne({ applicationId });
    return ConversationMapper.toDomain(doc);
  }

  /**
   * Find all conversations (admin)
   * @param {number} limit - Maximum number of results
   * @param {number} skip - Number of results to skip
   * @returns {Promise<Array<Conversation>>} Array of domain entities
   */
  async findAll(limit = 50, skip = 0) {
    const docs = await ConversationModel.find()
      .populate('participants', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip);

    return ConversationMapper.toDomainArray(docs);
  }

  /**
   * Find conversations by status
   * @param {string} status - Conversation status
   * @param {string} userId - User ID (optional filter)
   * @returns {Promise<Array<Conversation>>} Array of domain entities
   */
  async findByStatus(status, userId = null) {
    const query = { status };

    if (userId) {
      query.participants = userId;
    }

    const docs = await ConversationModel.find(query).sort({ updatedAt: -1 });

    return ConversationMapper.toDomainArray(docs);
  }

  /**
   * Create new conversation
   * @param {Conversation} entity - Domain entity
   * @returns {Promise<Conversation>} Created domain entity
   */
  async create(entity) {
    const data = ConversationMapper.toMongoose(entity);
    const doc = new ConversationModel(data);
    const saved = await doc.save();
    return ConversationMapper.toDomain(saved);
  }

  /**
   * Update existing conversation
   * @param {string} id - Conversation ID
   * @param {Conversation} entity - Domain entity with updates
   * @returns {Promise<Conversation|null>} Updated domain entity or null
   */
  async update(id, entity) {
    const data = ConversationMapper.toMongooseUpdate(entity);
    const updated = await ConversationModel.findByIdAndUpdate(id, data, {
      new: true,
    });

    return ConversationMapper.toDomain(updated);
  }

  /**
   * Delete conversation (use archive instead in most cases)
   * @param {string} id - Conversation ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await ConversationModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Find multiple conversations by IDs
   * @param {Array<string>} ids - Array of conversation IDs
   * @returns {Promise<Array<Conversation>>} Array of domain entities
   */
  async findByIds(ids) {
    const docs = await ConversationModel.find({ _id: { $in: ids } });
    return ConversationMapper.toDomainArray(docs);
  }

  /**
   * Update last message in conversation
   * @param {string} id - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} content - Message content
   * @param {string} senderId - Sender ID
   * @returns {Promise<Conversation|null>} Updated domain entity
   */
  async updateLastMessage(id, messageId, content, senderId) {
    const updated = await ConversationModel.findByIdAndUpdate(
      id,
      {
        lastMessage: {
          messageId,
          text: content,
          content: content,
          senderId,
          timestamp: new Date(),
          sentAt: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    return ConversationMapper.toDomain(updated);
  }

  /**
   * Archive conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<Conversation|null>} Updated domain entity
   */
  async archive(id) {
    const updated = await ConversationModel.findByIdAndUpdate(
      id,
      {
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
      { new: true }
    );

    return ConversationMapper.toDomain(updated);
  }

  /**
   * Count conversations by participant
   * @param {string} userId - User ID
   * @param {string} status - Status filter (optional)
   * @returns {Promise<number>} Count
   */
  async countByParticipant(userId, status = null) {
    const query = { participants: userId };

    if (status) {
      query.status = status;
    }

    return await ConversationModel.countDocuments(query);
  }

  /**
   * Search conversations by participant name or content
   * @param {string} userId - User ID
   * @param {string} searchText - Search text
   * @returns {Promise<Array<Conversation>>} Array of domain entities
   */
  async search(userId, searchText) {
    const docs = await ConversationModel.find({
      participants: userId,
      $or: [
        { 'lastMessage.text': { $regex: searchText, $options: 'i' } },
        { 'lastMessage.content': { $regex: searchText, $options: 'i' } },
      ],
    })
      .populate('participants', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    return ConversationMapper.toDomainArray(docs);
  }
}

module.exports = ConversationRepository;
