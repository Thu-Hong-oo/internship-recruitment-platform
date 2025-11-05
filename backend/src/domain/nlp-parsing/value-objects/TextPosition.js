/**
 * TextPosition Value Object
 * Domain: NLP-Parsing
 * Represents a position within text (start and end indices)
 */
class TextPosition {
  constructor(props) {
    this.start = props.start || 0;
    this.end = props.end || 0;
    this.page = props.page || 1;
    this.line = props.line || 1;

    this.validate();
  }

  validate() {
    if (this.start < 0) {
      throw new Error('Start position cannot be negative');
    }
    if (this.end < this.start) {
      throw new Error('End position must be greater than or equal to start position');
    }
    if (this.page < 1) {
      throw new Error('Page number must be positive');
    }
    if (this.line < 1) {
      throw new Error('Line number must be positive');
    }
  }

  getLength() {
    return this.end - this.start;
  }

  overlaps(other) {
    return other instanceof TextPosition &&
           this.start < other.end &&
           this.end > other.start;
  }

  contains(other) {
    return other instanceof TextPosition &&
           this.start <= other.start &&
           this.end >= other.end;
  }

  equals(other) {
    return other instanceof TextPosition &&
           this.start === other.start &&
           this.end === other.end &&
           this.page === other.page &&
           this.line === other.line;
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      page: this.page,
      line: this.line,
      length: this.getLength()
    };
  }
}

module.exports = TextPosition;