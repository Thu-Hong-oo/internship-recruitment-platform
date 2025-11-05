// src/domain/identity/Credential.js
const bcrypt = require('bcrypt');

class Credential {
  constructor(userId, password, lastLogin = null) {
    this.userId = userId;
    this.password = password;
    this.lastLogin = lastLogin;
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  async changePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    this.password = await bcrypt.hash(newPassword, 10);
  }

  updateLastLogin() {
    this.lastLogin = new Date();
  }
}

module.exports = Credential;
