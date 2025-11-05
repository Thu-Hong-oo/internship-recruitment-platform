/**
 * Education Entity
 * Domain: Recruitment
 * Represents education background of a candidate
 */
class Education {
  constructor(props) {
    this._educationId = props.educationId;
    this._candidateId = props.candidateId;
    this._institution = props.institution;
    this._degree = props.degree;
    this._fieldOfStudy = props.fieldOfStudy;
    this._startDate = props.startDate;
    this._endDate = props.endDate || null;
    this._grade = props.grade || null;
    this._description = props.description || null;

    // Private properties
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  validate() {
    if (!this._candidateId) {
      throw new Error('Candidate ID is required');
    }
    if (!this._institution) {
      throw new Error('Institution is required');
    }
    if (!this._degree) {
      throw new Error('Degree is required');
    }
    if (!this._fieldOfStudy) {
      throw new Error('Field of study is required');
    }
    if (!this._startDate) {
      throw new Error('Start date is required');
    }
  }

  // Getters
  get educationId() { return this._educationId; }
  get candidateId() { return this._candidateId; }
  get institution() { return this._institution; }
  get degree() { return this._degree; }
  get fieldOfStudy() { return this._fieldOfStudy; }
  get startDate() { return this._startDate; }
  get endDate() { return this._endDate; }
  get grade() { return this._grade; }
  get description() { return this._description; }

  // Business methods
  update(details) {
    if (details.institution) this._institution = details.institution;
    if (details.degree) this._degree = details.degree;
    if (details.fieldOfStudy) this._fieldOfStudy = details.fieldOfStudy;
    if (details.endDate !== undefined) this._endDate = details.endDate;
    if (details.grade !== undefined) this._grade = details.grade;
    if (details.description !== undefined) this._description = details.description;

    this._updatedAt = new Date();
    this.validate();
  }

  toJSON() {
    return {
      educationId: this._educationId,
      candidateId: this._candidateId,
      institution: this._institution,
      degree: this._degree,
      fieldOfStudy: this._fieldOfStudy,
      startDate: this._startDate,
      endDate: this._endDate,
      grade: this._grade,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}

module.exports = Education;
