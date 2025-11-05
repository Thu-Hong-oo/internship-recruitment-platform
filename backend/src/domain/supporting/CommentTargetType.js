// src/domain/supporting/CommentTargetType.js
class CommentTargetType {
  static JOB_POSTING = 'JOB_POSTING';
  static COMPANY = 'COMPANY';
  static CANDIDATE_PROFILE = 'CANDIDATE_PROFILE';
  static SUPPORT_TICKET = 'SUPPORT_TICKET';

  static values() {
    return [
      this.JOB_POSTING,
      this.COMPANY,
      this.CANDIDATE_PROFILE,
      this.SUPPORT_TICKET,
    ];
  }

  static isValid(type) {
    return this.values().includes(type);
  }
}

module.exports = CommentTargetType;
