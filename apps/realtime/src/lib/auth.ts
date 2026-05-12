import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: string;
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET || 'development-secret-change-in-production';
  const decoded = jwt.verify(token, secret) as TokenPayload;
  return decoded;
}
