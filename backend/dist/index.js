"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const auth_js_1 = require("./routes/auth.js");
const users_js_1 = require("./routes/users.js");
const quizzes_js_1 = require("./routes/quizzes.js");
const questions_js_1 = require("./routes/questions.js");
const rooms_js_1 = require("./routes/rooms.js");
const leaderboard_js_1 = require("./routes/leaderboard.js");
const leagues_js_1 = require("./routes/leagues.js");
const analytics_js_1 = require("./routes/analytics.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const auth_js_2 = require("./middleware/auth.js");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many requests, please try again later' } });
app.use('/api/', limiter);
app.get('/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });
app.use('/api/auth', auth_js_1.authRouter);
app.use('/api/users', auth_js_2.authMiddleware, users_js_1.userRouter);
app.use('/api/quizzes', auth_js_2.authMiddleware, quizzes_js_1.quizRouter);
app.use('/api/questions', auth_js_2.authMiddleware, questions_js_1.questionRouter);
app.use('/api/rooms', auth_js_2.authMiddleware, rooms_js_1.roomRouter);
app.use('/api/leaderboard', auth_js_2.authMiddleware, leaderboard_js_1.leaderboardRouter);
app.use('/api/leagues', auth_js_2.authMiddleware, leagues_js_1.leagueRouter);
app.use('/api/analytics', auth_js_2.authMiddleware, analytics_js_1.analyticsRouter);
app.use(errorHandler_js_1.errorHandler);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await exports.prisma.$disconnect();
    process.exit(0);
});
