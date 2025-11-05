/**
 * IFieldOfStudyRepository Interface
 * Domain: Master-Data
 * Repository interface for FieldOfStudy entity
 */
class IFieldOfStudyRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByName(name) {
    throw new Error('Method not implemented');
  }

  async findByDegree(degreeId) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async save(fieldOfStudy) {
    throw new Error('Method not implemented');
  }

  async update(fieldOfStudy) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IFieldOfStudyRepository;