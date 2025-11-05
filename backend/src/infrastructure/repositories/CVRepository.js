const CV = require('../models/CV');

/**
 * CVRepository
 * Infrastructure layer for CV data operations
 */
class CVRepository {
  async findById(id) {
    return await CV.findById(id);
  }

  async findByCandidate(candidateId) {
    return await CV.find({ candidateId, isActive: true });
  }

  async create(cvData) {
    const cv = new CV(cvData);
    return await cv.save();
  }

  async update(id, cvData) {
    return await CV.findByIdAndUpdate(id, cvData, { new: true });
  }

  async deleteCV(id) {
    return await CV.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async setAsDefault(cvId) {
    const cv = await CV.findById(cvId);
    if (cv) {
      return await cv.setAsDefault();
    }
    return null;
  }

  async getDefaultCV(candidateId) {
    return await CV.findOne({ candidateId, isDefault: true, isActive: true });
  }

  async getAnalysisByCV(cvId) {
    // This would typically join with CVAnalysis model
    // For now, return the CV with analysis status
    return await CV.findById(cvId).select('analysisStatus');
  }

  async updateAnalysisStatus(cvId, status) {
    return await CV.findByIdAndUpdate(
      cvId,
      { analysisStatus: status },
      { new: true }
    );
  }
}

module.exports = CVRepository;
