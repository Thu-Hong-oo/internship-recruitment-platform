/**
 * Bookmark Entity
 * Domain: Supporting
 * Represents a bookmark for various items (jobs, companies, articles, etc.)
 */
class Bookmark {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.bookmarkType = props.bookmarkType;
    this.itemId = props.itemId; // ID of the bookmarked item
    this.title = props.title || ''; // Cached title for quick display
    this.description = props.description || ''; // Cached description
    this.url = props.url || ''; // Direct link to the item
    this.tags = props.tags || [];
    this.notes = props.notes || '';
    this.bookmarkedAt = props.bookmarkedAt;
    this.isActive = props.isActive !== undefined ? props.isActive : true;

    this.validate();
  }

  validate() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!this.bookmarkType) {
      throw new Error('Bookmark type is required');
    }
    if (!this.itemId) {
      throw new Error('Item ID is required');
    }
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  addNote(note) {
    this.notes += (this.notes ? '\n' : '') + note;
  }

  updateCache(title, description, url) {
    if (title) this.title = title;
    if (description) this.description = description;
    if (url) this.url = url;
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      bookmarkType: this.bookmarkType,
      itemId: this.itemId,
      title: this.title,
      description: this.description,
      url: this.url,
      tags: this.tags,
      notes: this.notes,
      bookmarkedAt: this.bookmarkedAt,
      isActive: this.isActive
    };
  }
}

module.exports = Bookmark;