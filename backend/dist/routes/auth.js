"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_js_1 = require("../index.js");
const auth_js_1 = require("../middleware/auth.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
exports.authRouter = router;
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.nativeEnum(client_1.UserRole).default(client_1.UserRole.STUDENT),
    collegeId: zod_1.z.string().uuid().optional(),
    branchId: zod_1.z.string().uuid().optional(),
    semester: zod_1.z.number().int().min(1).max(8).optional(),
    year: zod_1.z.number().int().min(1).max(4).optional(),
});
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string() });
router.post('/register', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await index_js_1.prisma.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new errorHandler_js_1.AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const user = await index_js_1.prisma.user.create({ data: { email: data.email, passwordHash, name: data.name, role: data.role, collegeId: data.collegeId, branchId: data.branchId, semester: data.semester, year: data.year }, select: { id: true, email: true, name: true, role: true, collegeId: true, branchId: true } });
    const token = (0, auth_js_1.generateToken)(user);
    res.status(201).json({ user, token });
}));
router.post('/login', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await index_js_1.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash)
        throw new errorHandler_js_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    const valid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
    if (!valid)
        throw new errorHandler_js_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    const token = (0, auth_js_1.generateToken)({ id: user.id, email: user.email, role: user.role, collegeId: user.collegeId ?? undefined, branchId: user.branchId ?? undefined });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, collegeId: user.collegeId, branchId: user.branchId, avatarUrl: user.avatarUrl }, token });
}));
router.get('/me', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errorHandler_js_1.AppError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    const user = await index_js_1.prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true, avatarUrl: true, collegeId: true, branchId: true, semester: true, year: true, rating: true, integrityScore: true, streak: true, longestStreak: true, createdAt: true } });
    if (!user)
        throw new errorHandler_js_1.AppError(404, 'User not found', 'USER_NOT_FOUND');
    res.json({ user });
}));
router.post('/refresh', (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errorHandler_js_1.AppError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
    const token = (0, auth_js_1.generateToken)(req.user);
    res.json({ token });
}));
router.post('/logout', (_req, res) => { res.json({ message: 'Logged out successfully' }); });
