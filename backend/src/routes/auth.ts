import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
  collegeId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  year: z.number().int().min(1).max(4).optional(),
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({ data: { email: data.email, passwordHash, name: data.name, role: data.role, collegeId: data.collegeId, branchId: data.branchId, semester: data.semester, year: data.year }, select: { id: true, email: true, name: true, role: true, collegeId: true, branchId: true } });
  const token = generateToken(user);
  res.status(201).json({ user, token });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.passwordHash) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const token = generateToken({ id: user.id, email: user.email, role: user.role, collegeId: user.collegeId ?? undefined, branchId: user.branchId ?? undefined });
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, collegeId: user.collegeId, branchId: user.branchId, avatarUrl: user.avatarUrl }, token });
}));

router.get('/me', asyncHandler(async (req: any, res) => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true, avatarUrl: true, collegeId: true, branchId: true, semester: true, year: true, rating: true, integrityScore: true, streak: true, longestStreak: true, createdAt: true } });
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  res.json({ user });
}));

router.post('/refresh', asyncHandler(async (req: any, res) => {
  if (!req.user) throw new AppError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  const token = generateToken(req.user);
  res.json({ token });
}));

router.post('/logout', (_req, res) => { res.json({ message: 'Logged out successfully' }); });

export { router as authRouter };