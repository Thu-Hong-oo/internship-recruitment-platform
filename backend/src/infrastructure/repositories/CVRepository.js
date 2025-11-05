const CVModel = require('../models/CV');
const CVMapper = require('../mappers/CVMapper');

/**
 * CVRepository
 * Infrastructure layer for CV data operations
 * Uses CVMapper to convert between domain entities and Mongoose documents
 */
class CVRepository {
  async findById(id) {
    const cvDoc = await CVModel.findById(id);
    return cvDoc ? CVMapper.toDomain(cvDoc) : null;
  }

  async findByCandidate(candidateId) {
    const cvDocs = await CVModel.find({ candidateId, isActive: true }).sort({
      createdAt: -1,
    });
    return CVMapper.toDomainArray(cvDocs);
  }

  async create(cvEntity) {
    const cvData = CVMapper.toMongoose(cvEntity);
    const cv = new CVModel(cvData);
    const savedDoc = await cv.save();
    return CVMapper.toDomain(savedDoc);
  }

  async update(id, cvEntity) {
    const cvData = CVMapper.toMongoose(cvEntity);
    const updatedDoc = await CVModel.findByIdAndUpdate(id, cvData, {
      new: true,
    });
    return updatedDoc ? CVMapper.toDomain(updatedDoc) : null;
  }

  async delete(id) {
    const deletedDoc = await CVModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    return deletedDoc ? CVMapper.toDomain(deletedDoc) : null;
  }

  async setAsDefault(cvId, candidateId) {
    // Remove default flag from all other CVs
    await CVModel.updateMany(
      { candidateId, _id: { $ne: cvId } },
      { isDefault: false }
    );

    // Set this CV as default
    const updatedDoc = await CVModel.findByIdAndUpdate(
      cvId,
      { isDefault: true },
      { new: true }
    );

    return updatedDoc ? CVMapper.toDomain(updatedDoc) : null;
  }

  async getDefaultCV(candidateId) {
    const cvDoc = await CVModel.findOne({
      candidateId,
      isDefault: true,
      isActive: true,
    });
    return cvDoc ? CVMapper.toDomain(cvDoc) : null;
  }

  async getAnalysisByCV(cvId) {
    const cvDoc = await CVModel.findById(cvId).select('analysisStatus');
    return cvDoc ? CVMapper.toDomain(cvDoc) : null;
  }

  async updateAnalysisStatus(cvId, status) {
    const updatedDoc = await CVModel.findByIdAndUpdate(
      cvId,
      { analysisStatus: status },
      { new: true }
    );
    return updatedDoc ? CVMapper.toDomain(updatedDoc) : null;
  }

  async findAll() {
    const cvDocs = await CVModel.find();
    return CVMapper.toDomainArray(cvDocs);
  }

  async findActiveByCandidate(candidateId) {
    const cvDocs = await CVModel.find({ candidateId, isActive: true });
    return CVMapper.toDomainArray(cvDocs);
  }
}

module.exports = CVRepository;
