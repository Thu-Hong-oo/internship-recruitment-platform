// User Repository Interface
class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async updateCandidateProfile(userId, candidateProfileId) {
    throw new Error('Method not implemented');
  }

  async updateEmployerProfile(userId, employerProfileId) {
    throw new Error('Method not implemented');
  }

  async update(id, data) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
