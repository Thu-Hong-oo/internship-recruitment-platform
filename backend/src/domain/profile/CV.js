// src/domain/profile/CV.js
class CV {
  constructor(cvId, candidateId, fileUrl, fileName) {
    this.cvId = cvId;
    this.candidateId = candidateId;
    this.fileUrl = fileUrl;
    this.fileName = fileName;
    this.uploadedAt = new Date();
    this.isDefault = false;
  }

  upload(file) {
    // Logic to handle file upload
    this.fileUrl = file.url;
    this.fileName = file.name;
    this.uploadedAt = new Date();
  }

  markAsDefault() {
    this.isDefault = true;
  }

  unmarkAsDefault() {
    this.isDefault = false;
  }
}

module.exports = CV;
