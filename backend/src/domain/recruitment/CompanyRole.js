// src/domain/recruitment/CompanyRole.js
class CompanyRole {
  static OWNER = 'OWNER';
  static ADMIN = 'ADMIN';
  static HR_MANAGER = 'HR_MANAGER';
  static RECRUITER = 'RECRUITER';
  static EMPLOYEE = 'EMPLOYEE';
  static VIEWER = 'VIEWER';

  static values() {
    return [
      this.OWNER,
      this.ADMIN,
      this.HR_MANAGER,
      this.RECRUITER,
      this.EMPLOYEE,
      this.VIEWER,
    ];
  }

  static isValid(role) {
    return this.values().includes(role);
  }

  static getDescription(role) {
    const descriptions = {
      [this.OWNER]: 'Chủ sở hữu công ty - có quyền cao nhất',
      [this.ADMIN]: 'Quản trị viên - quản lý thành viên và cài đặt',
      [this.HR_MANAGER]: 'Quản lý nhân sự - quản lý tuyển dụng',
      [this.RECRUITER]: 'Tuyển dụng viên - đăng tin và xem hồ sơ',
      [this.EMPLOYEE]: 'Nhân viên - quyền hạn chế',
      [this.VIEWER]: 'Người xem - chỉ xem thông tin',
    };
    return descriptions[role] || 'Unknown role';
  }
}

module.exports = CompanyRole;
