// src/domain/profile/value-objects/Education.js

class Education {
  constructor(degree, school, major, graduationYear, gpa = null) {
    this.degree = degree;
    this.school = school;
    this.major = major;
    this.graduationYear = graduationYear;
    this.gpa = gpa;
  }

  getFullEducation() {
    return `${this.degree} in ${this.major} from ${this.school} (${this.graduationYear})`;
  }

  isCompleted() {
    return this.graduationYear <= new Date().getFullYear();
  }
}

module.exports = Education;
