// src/domain/recruitment/entities/JobFollowing.js
const FollowingTargetType = require('../enums/FollowingTargetType');

class JobFollowing {
  constructor(
    followingId,
    userId,
    targetId,
    targetType = FollowingTargetType.JOB_POSTING
  ) {
    this.followingId = followingId;
    this.userId = userId;
    this.targetId = targetId;
    this.targetType = targetType;
  }

  follow() {
    // Logic to follow
  }

  unfollow() {
    // Logic to unfollow
  }
}

module.exports = JobFollowing;
