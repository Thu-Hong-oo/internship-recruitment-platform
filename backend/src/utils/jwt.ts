import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 * @param userId - User ID
 * @returns JWT token
 */
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * Verify JWT token
 * @param token - JWT token
 * @returns Decoded token payload
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
};
