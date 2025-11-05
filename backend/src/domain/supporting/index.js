// Supporting Domain Exports
// Entities
const SavedJob = require('./entities/SavedJob');
const Bookmark = require('./entities/Bookmark');
const Comment = require('./Comment');

// Enums
const SavedJobStatus = require('./enums/SavedJobStatus');
const BookmarkType = require('./enums/BookmarkType');
const CommentTargetType = require('./CommentTargetType');

// Value Objects
const Tag = require('./value-objects/Tag');

// Repository Interfaces
const ISavedJobRepository = require('./repositories/ISavedJobRepository');
const IBookmarkRepository = require('./repositories/IBookmarkRepository');

module.exports = {
  // Entities
  SavedJob,
  Bookmark,
  Comment,

  // Enums
  SavedJobStatus,
  BookmarkType,
  CommentTargetType,

  // Value Objects
  Tag,

  // Repository Interfaces
  ISavedJobRepository,
  IBookmarkRepository,
};
