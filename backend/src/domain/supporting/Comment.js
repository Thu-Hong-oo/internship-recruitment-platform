// src/domain/supporting/Comment.js
const CommentTargetType = require('./CommentTargetType');

class Comment {
  static COMMENT_TARGET_TYPES = CommentTargetType;

  constructor(
    commentId,
    userId,
    targetType,
    targetId,
    content,
    parentCommentId = null
  ) {
    this.commentId = commentId;
    this.userId = userId;
    this.targetType = targetType;
    this.targetId = targetId;
    this.content = content;
    this.parentCommentId = parentCommentId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isDeleted = false;
  }

  create() {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    if (!Object.values(CommentTargetType).includes(this.targetType)) {
      throw new Error('Invalid target type');
    }
    // Domain event would be raised here
  }

  update(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    this.content = content;
    this.updatedAt = new Date();
  }

  delete() {
    this.isDeleted = true;
    this.updatedAt = new Date();
  }

  reply(parentCommentId, content) {
    if (this.parentCommentId) {
      throw new Error('Cannot reply to a reply');
    }
    return new Comment(
      null, // Will be generated
      this.userId,
      this.targetType,
      this.targetId,
      content,
      this.commentId
    );
  }

  isReply() {
    return this.parentCommentId !== null;
  }
}

module.exports = Comment;
