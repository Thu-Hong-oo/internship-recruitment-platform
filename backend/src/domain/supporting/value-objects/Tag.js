/**
 * Tag Value Object
 * Domain: Supporting
 * Represents a tag for categorizing items
 */
class Tag {
  constructor(props) {
    this.name = props.name;
    this.color = props.color || '#007bff'; // Default blue color
    this.description = props.description || '';

    this.validate();
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Tag name is required');
    }
    if (this.name.length > 50) {
      throw new Error('Tag name cannot exceed 50 characters');
    }
    if (this.description && this.description.length > 200) {
      throw new Error('Tag description cannot exceed 200 characters');
    }
  }

  getNormalizedName() {
    return this.name.toLowerCase().trim();
  }

  updateColor(color) {
    // Basic hex color validation
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error('Color must be a valid hex color code');
    }
    this.color = color;
  }

  updateDescription(description) {
    if (description && description.length > 200) {
      throw new Error('Tag description cannot exceed 200 characters');
    }
    this.description = description;
  }

  equals(other) {
    return other instanceof Tag &&
           this.getNormalizedName() === other.getNormalizedName();
  }

  toJSON() {
    return {
      name: this.name,
      color: this.color,
      description: this.description,
      normalizedName: this.getNormalizedName()
    };
  }
}

module.exports = Tag;