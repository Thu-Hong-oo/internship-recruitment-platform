/**
 * ICredentialRepository Interface
 * Domain: Identity
 * Repository interface for Credential entity
 */
class ICredentialRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findByEmailVerificationToken(token) {
    throw new Error('Method not implemented');
  }

  async findByPasswordResetToken(token) {
    throw new Error('Method not implemented');
  }

  async create(credentialData) {
    throw new Error('Method not implemented');
  }

  async update(id, credentialData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async updatePassword(userId, newPassword) {
    throw new Error('Method not implemented');
  }

  async verifyEmail(userId) {
    throw new Error('Method not implemented');
  }

  async setEmailVerificationToken(userId, token, expires) {
    throw new Error('Method not implemented');
  }

  async clearEmailVerificationToken(userId) {
    throw new Error('Method not implemented');
  }

  async setPasswordResetToken(userId, token, expires) {
    throw new Error('Method not implemented');
  }

  async clearPasswordResetToken(userId) {
    throw new Error('Method not implemented');
  }

  async updateLastLogin(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = ICredentialRepository;
