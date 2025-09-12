/**
 * Avatar utility functions
 */

/**
 * Generate default avatar URL using UI Avatars service
 * @param {string} fullName - User's full name
 * @param {string} email - User's email (fallback)
 * @returns {string} Avatar URL
 */
const generateDefaultAvatar = (fullName, email = '') => {
  const name = fullName || email || 'User';
  const initials = getInitials(fullName, email);

  // Tạo avatar với hình dáng cong người (rounded) và initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=4F46E5&color=ffffff&size=200&bold=true&format=png&rounded=true&uppercase=true`;
};

/**
 * Extract initials from name
 * @param {string} fullName - Full name
 * @param {string} email - Email (fallback)
 * @returns {string} Initials (max 2 characters)
 */
const getInitials = (fullName, email = '') => {
  if (fullName) {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (email) {
    return email.substring(0, 2).toUpperCase();
  }

  return 'U';
};

/**
 * Get avatar URL for user
 * @param {Object} user - User object
 * @returns {string} Avatar URL
 */
const getAvatarUrl = user => {
  if (!user) return generateDefaultAvatar();

  const { avatar, fullName, email } = user;

  // If avatar is a full URL (Cloudinary or external)
  if (avatar && avatar.startsWith('http')) {
    return avatar;
  }

  // If avatar is a Cloudinary public ID
  if (
    avatar &&
    avatar !== 'default-avatar' &&
    !avatar.includes('ui-avatars.com')
  ) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/${avatar}`;
  }

  // Use Google profile picture if available
  if (user.googleProfile && user.googleProfile.picture) {
    return user.googleProfile.picture;
  }

  // Generate default avatar with initials
  return generateDefaultAvatar(fullName, email);
};

module.exports = {
  generateDefaultAvatar,
  getAvatarUrl,
  getInitials,
};
