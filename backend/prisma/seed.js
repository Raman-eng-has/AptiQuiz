"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    await prisma.auditLog.deleteMany();
    await prisma.powerUpUse.deleteMany();
    await prisma.integrityEvent.deleteMany();
    await prisma.roundResult.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.roomPlayer.deleteMany();
    await prisma.team.deleteMany();
    await prisma.room.deleteMany();
    await prisma.leagueScore.deleteMany();
    await prisma.leagueSeason.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.dailyChallenge.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.questionVariant.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.section.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.college.deleteMany();
    await prisma.user.deleteMany();
    console.log('📚 Creating colleges...');
    const colleges = await Promise.all([
        prisma.college.create({
            data: {
                name: 'Noida Institute of Engineering and Technology',
                code: 'NIET',
                domain: 'niet.co.in',
                address: 'Greater Noida, Uttar Pradesh',
            },
        }),
        prisma.college.create({
            data: {
                name: 'Delhi Technological University',
                code: 'DTU',
                domain: 'dtu.ac.in',
                address: 'Delhi',
            },
        }),
        prisma.college.create({
            data: {
                name: 'Netaji Subhas University of Technology',
                code: 'NSUT',
                domain: 'nsut.ac.in',
                address: 'Delhi',
            },
        }),
    ]);
    console.log('🏫 Creating branches...');
    const branches = await Promise.all([
        prisma.branch.create({ data: { collegeId: colleges[0].id, name: 'Computer Science & Engineering', code: 'CSE' } }),
        prisma.branch.create({ data: { collegeId: colleges[0].id, name: 'Electronics & Communication', code: 'ECE' } }),
        prisma.branch.create({ data: { collegeId: colleges[0].id, name: 'Information Technology', code: 'IT' } }),
        prisma.branch.create({ data: { collegeId: colleges[1].id, name: 'Computer Engineering', code: 'COE' } }),
        prisma.branch.create({ data: { collegeId: colleges[1].id, name: 'Software Engineering', code: 'SE' } }),
        prisma.branch.create({ data: { collegeId: colleges[2].id, name: 'Computer Science', code: 'CS' } }),
        prisma.branch.create({ data: { collegeId: colleges[2].id, name: 'Electronics', code: 'EC' } }),
    ]);
    console.log('👥 Creating users...');
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@aptiquiz.com',
                passwordHash,
                name: 'Super Admin',
                role: client_1.UserRole.SUPER_ADMIN,
            },
        }),
        prisma.user.create({
            data: {
                email: 'host@niit.com',
                passwordHash,
                name: 'Dr. Rajesh Kumar',
                role: client_1.UserRole.HOST,
                collegeId: colleges[0].id,
                branchId: branches[0].id,
            },
        }),
        prisma.user.create({
            data: {
                email: 'student1@niit.com',
                passwordHash,
                name: 'Aarav Sharma',
                role: client_1.UserRole.STUDENT,
                collegeId: colleges[0].id,
                branchId: branches[0].id,
                semester: 6,
                year: 3,
            },
        }),
        prisma.user.create({
            data: {
                email: 'student2@niit.com',
                passwordHash,
                name: 'Priya Singh',
                role: client_1.UserRole.STUDENT,
                collegeId: colleges[0].id,
                branchId: branches[0].id,
                semester: 6,
                year: 3,
            },
        }),
        prisma.user.create({
            data: {
                email: 'student3@niit.com',
                passwordHash,
                name: 'Rohan Gupta',
                role: client_1.UserRole.STUDENT,
                collegeId: colleges[0].id,
                branchId: branches[1].id,
                semester: 4,
                year: 2,
            },
        }),
        prisma.user.create({
            data: {
                email: 'admin@niit.com',
                passwordHash,
                name: 'Prof. Meera Nair',
                role: client_1.UserRole.COLLEGE_ADMIN,
                collegeId: colleges[0].id,
            },
        }),
    ]);
    console.log('🏷️ Creating badges...');
    const badges = await Promise.all([
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.FIRST_WIN,
                name: 'First Win',
                description: 'Won your first quiz!',
                icon: '🏆',
                rarity: 'COMMON',
                criteria: 'Win a quiz for the first time',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.PODIUM,
                name: 'Podium Finish',
                description: 'Finished in top 3',
                icon: '🥉',
                rarity: 'RARE',
                criteria: 'Finish in top 3 in any quiz',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.SPEED_DEMON,
                name: 'Speed Demon',
                description: 'Average answer time under 5s with 80% accuracy',
                icon: '⚡',
                rarity: 'EPIC',
                criteria: 'Average answer time < 5s with ≥80% accuracy in a quiz',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.PERFECT_ROUND,
                name: 'Perfect Round',
                description: 'Answered all questions correctly in a quiz',
                icon: '💯',
                rarity: 'EPIC',
                criteria: '100% accuracy in a quiz with ≥10 questions',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.STREAK_7,
                name: 'Week Warrior',
                description: '7-day login streak',
                icon: '🔥',
                rarity: 'COMMON',
                criteria: 'Login 7 consecutive days',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.STREAK_30,
                name: 'Monthly Master',
                description: '30-day login streak',
                icon: '📅',
                rarity: 'RARE',
                criteria: 'Login 30 consecutive days',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.TOPIC_MASTER,
                name: 'Quant Master',
                description: 'Mastered Quantitative Aptitude',
                icon: '🧮',
                rarity: 'EPIC',
                criteria: 'Score 90%+ in 10 Quant quizzes',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.COMEBACK_KID,
                name: 'Comeback Kid',
                description: 'Climbed 10+ ranks in a single quiz',
                icon: '📈',
                rarity: 'RARE',
                criteria: 'Improve rank by 10+ positions during a quiz',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.GIANT_SLAYER,
                name: 'Giant Slayer',
                description: 'Beat a top-10 ranked player',
                icon: '⚔️',
                rarity: 'LEGENDARY',
                criteria: 'Defeat a player in global top 10',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.FAIR_PLAYER,
                name: 'Fair Player',
                description: 'Clean integrity record',
                icon: '🛡️',
                rarity: 'RARE',
                criteria: 'Zero integrity flags across 20 quizzes',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.TEAM_CHAMPION,
                name: 'Team Champion',
                description: 'Won a team battle',
                icon: '🤝',
                rarity: 'EPIC',
                criteria: 'Win a team battle quiz',
            },
        }),
        prisma.badge.create({
            data: {
                type: client_1.BadgeType.LEAGUE_TOP_10,
                name: 'League Elite',
                description: 'Top 10 in a league season',
                icon: '👑',
                rarity: 'LEGENDARY',
                criteria: 'Finish in top 10 in any league season',
            },
        }),
    ]);
    console.log('❓ Creating questions...');
    const questionTemplates = [
        // Quantitative Aptitude
        { text: 'A train of length {a} m passes a pole in {b} seconds. What is the speed of the train in km/hr?', type: client_1.QuestionType.NUMERIC, topic: 'Quantitative Aptitude', subtopic: 'Time Speed Distance', difficulty: client_1.Difficulty.EASY, timeLimit: 60, points: 100, isParameterized: true, parameterTemplate: 'A train of length {a} m passes a pole in {b} seconds. What is the speed of the train in km/hr?', correctAnswer: '{{a * 3.6 / b}}', numericTolerance: 0.5, explanation: 'Speed = Distance/Time = a/b m/s = (a/b) * 3.6 km/hr' },
        { text: 'If the ratio of two numbers is 3:4 and their LCM is 120, what is their HCF?', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Quantitative Aptitude', subtopic: 'Number Systems', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 90, points: 150, options: ['10', '12', '15', '20'], correctAnswer: '10', explanation: 'Let numbers be 3x and 4x. LCM = 12x = 120, so x = 10. HCF = x = 10.' },
        { text: 'A shopkeeper marks his goods 40% above cost price and gives a discount of 20%. What is his profit percentage?', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Quantitative Aptitude', subtopic: 'Profit Loss', difficulty: client_1.Difficulty.EASY, timeLimit: 60, points: 100, options: ['8%', '10%', '12%', '15%'], correctAnswer: '12%', explanation: 'CP = 100, MP = 140, SP = 112, Profit = 12%' },
        { text: 'The compound interest on Rs. 10,000 at 10% per annum for 2 years, compounded annually is:', type: client_1.QuestionType.NUMERIC, topic: 'Quantitative Aptitude', subtopic: 'Compound Interest', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 90, points: 150, correctAnswer: '2100', numericTolerance: 1, explanation: 'CI = P(1+r)^n - P = 10000(1.1)^2 - 10000 = 2100' },
        { text: 'A can complete a work in 10 days, B in 15 days. They work together for 3 days. What fraction of work is left?', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Quantitative Aptitude', subtopic: 'Time Work', difficulty: client_1.Difficulty.EASY, timeLimit: 60, points: 100, options: ['1/2', '2/5', '3/5', '1/3'], correctAnswer: '1/2', explanation: 'A: 1/10/day, B: 1/15/day. Together: 1/6/day. In 3 days: 1/2. Left: 1/2' },
        // Logical Reasoning
        { text: 'If CAT is coded as 3120, how is DOG coded?', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Logical Reasoning', subtopic: 'Coding Decoding', difficulty: client_1.Difficulty.EASY, timeLimit: 60, points: 100, options: ['4157', '4156', '4158', '4159'], correctAnswer: '4157', explanation: 'C=3, A=1, T=20. D=4, O=15, G=7 → 4157' },
        { text: 'Find the next term: 2, 6, 12, 20, 30, ?', type: client_1.QuestionType.NUMERIC, topic: 'Logical Reasoning', subtopic: 'Number Series', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 60, points: 150, correctAnswer: '42', numericTolerance: 0, explanation: 'Pattern: n(n+1). 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42' },
        { text: 'Statement: All engineers are smart. Some smart people are rich. Conclusion: Some engineers are rich.', type: client_1.QuestionType.TRUE_FALSE, topic: 'Logical Reasoning', subtopic: 'Syllogism', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 60, points: 150, options: ['True', 'False'], correctAnswer: 'False', explanation: 'The middle term "smart" is not distributed. Cannot conclude.' },
        { text: 'In a row of 40 students, Raman is 12th from left. What is his position from right?', type: client_1.QuestionType.NUMERIC, topic: 'Logical Reasoning', subtopic: 'Ranking', difficulty: client_1.Difficulty.EASY, timeLimit: 30, points: 100, correctAnswer: '29', numericTolerance: 0, explanation: 'Position from right = Total - Position from left + 1 = 40 - 12 + 1 = 29' },
        // Verbal Ability
        { text: 'Choose the word most similar to "EPHEMERAL":', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Verbal Ability', subtopic: 'Synonyms', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 45, points: 150, options: ['Eternal', 'Transient', 'Permanent', 'Enduring'], correctAnswer: 'Transient', explanation: 'Ephemeral means lasting for a very short time. Transient is a synonym.' },
        { text: 'Choose the word opposite to "OBFUSCATE":', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Verbal Ability', subtopic: 'Antonyms', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 45, points: 150, options: ['Clarify', 'Confuse', 'Complicate', 'Blur'], correctAnswer: 'Clarify', explanation: 'Obfuscate means to make unclear. Clarify is the antonym.' },
        { text: 'Fill in the blank: The judge ______ the verdict until all evidence was reviewed.', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Verbal Ability', subtopic: 'Fill in the Blanks', difficulty: client_1.Difficulty.EASY, timeLimit: 30, points: 100, options: ['deferred', 'differed', 'defied', 'defiled'], correctAnswer: 'deferred', explanation: 'Defer means to postpone. Differ means to be unlike.' },
        // Data Interpretation
        { text: 'A company\'s revenue (in crores): 2019: 120, 2020: 150, 2021: 180, 2022: 210. What is the average annual growth rate?', type: client_1.QuestionType.NUMERIC, topic: 'Data Interpretation', subtopic: 'Growth Rates', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 90, points: 150, correctAnswer: '20', numericTolerance: 1, explanation: 'Total growth = 90 over 3 years. Average = 30/year. Growth rate = 30/150 * 100 = 20%' },
        { text: 'If a pie chart shows Education: 90°, Healthcare: 120°, Defense: 150°, what is the total budget?', type: client_1.QuestionType.SINGLE_CHOICE, topic: 'Data Interpretation', subtopic: 'Pie Charts', difficulty: client_1.Difficulty.EASY, timeLimit: 60, points: 100, options: ['Cannot be determined', '360°', '100%', 'All of the above'], correctAnswer: 'All of the above', explanation: 'Pie chart totals 360° which represents 100% of the budget.' },
        // Parameterized questions
        { text: 'A rectangle has length {l} cm and breadth {b} cm. Find its area.', type: client_1.QuestionType.NUMERIC, topic: 'Quantitative Aptitude', subtopic: 'Mensuration', difficulty: client_1.Difficulty.EASY, timeLimit: 30, points: 100, isParameterized: true, parameterTemplate: 'A rectangle has length {l} cm and breadth {b} cm. Find its area.', correctAnswer: '{{l * b}}', numericTolerance: 0.1, explanation: 'Area = length × breadth = l × b' },
        { text: 'Solve for x: {a}x + {b} = {c}', type: client_1.QuestionType.NUMERIC, topic: 'Quantitative Aptitude', subtopic: 'Algebra', difficulty: client_1.Difficulty.MEDIUM, timeLimit: 60, points: 150, isParameterized: true, parameterTemplate: 'Solve for x: {a}x + {b} = {c}', correctAnswer: '{{(c - b) / a}}', numericTolerance: 0.1, explanation: 'ax = c - b, so x = (c - b)/a' },
    ];
    const questions = [];
    for (const tmpl of questionTemplates) {
        const q = await prisma.question.create({
            data: {
                ...tmpl,
                options: tmpl.options || [],
                correctAnswer: JSON.stringify(tmpl.correctAnswer),
                parameterValues: tmpl.parameterValues || {},
                acceptedAnswers: tmpl.acceptedAnswers ? JSON.stringify(tmpl.acceptedAnswers) : null,
                createdBy: users[1].id,
            },
        });
        questions.push(q);
        if (tmpl.isParameterized) {
            for (let i = 0; i < 5; i++) {
                let paramValues = {};
                let renderedText = tmpl.parameterTemplate;
                let correctAns = 0;
                if (tmpl.parameterTemplate?.includes('{a}') && tmpl.parameterTemplate?.includes('{b}')) {
                    paramValues = { a: Math.floor(Math.random() * 200) + 100, b: Math.floor(Math.random() * 10) + 5 };
                    correctAns = Math.round((paramValues.a * 3.6 / paramValues.b) * 10) / 10;
                    renderedText = renderedText.replace('{a}', String(paramValues.a)).replace('{b}', String(paramValues.b));
                }
                else if (tmpl.parameterTemplate?.includes('{l}') && tmpl.parameterTemplate?.includes('{b}')) {
                    paramValues = { l: Math.floor(Math.random() * 50) + 5, b: Math.floor(Math.random() * 30) + 5 };
                    correctAns = paramValues.l * paramValues.b;
                    renderedText = renderedText.replace('{l}', String(paramValues.l)).replace('{b}', String(paramValues.b));
                }
                else if (tmpl.parameterTemplate?.includes('{a}') && tmpl.parameterTemplate?.includes('{b}') && tmpl.parameterTemplate?.includes('{c}')) {
                    paramValues = { a: Math.floor(Math.random() * 10) + 2, b: Math.floor(Math.random() * 50) + 10, c: Math.floor(Math.random() * 100) + 50 };
                    correctAns = Math.round(((paramValues.c - paramValues.b) / paramValues.a) * 10) / 10;
                    renderedText = renderedText.replace('{a}', String(paramValues.a)).replace('{b}', String(paramValues.b)).replace('{c}', String(paramValues.c));
                }
                await prisma.questionVariant.create({
                    data: {
                        questionId: q.id,
                        variantIndex: i,
                        parameterValues: paramValues,
                        renderedText,
                        renderedOptions: [],
                        correctAnswer: JSON.stringify(correctAns),
                    },
                });
            }
        }
    }
    console.log('📝 Creating quizzes...');
    const quiz1 = await prisma.quiz.create({
        data: {
            title: 'Quantitative Aptitude Basics',
            description: 'Fundamental quantitative aptitude questions for placement preparation',
            category: 'Placement',
            tags: ['Quant', 'Placement Prep', 'Easy'],
            targetCollegeId: colleges[0].id,
            targetBranchId: branches[0].id,
            targetSemester: 6,
            targetYear: 3,
            difficulty: client_1.Difficulty.EASY,
            visibility: client_1.QuizVisibility.COLLEGE_ONLY,
            timePerQuestion: 60,
            totalTimeLimit: 1200,
            negativeMarking: 0.25,
            enablePowerUps: true,
            adaptiveDifficulty: false,
            isPublished: true,
            createdBy: users[1].id,
            questions: {
                create: questions.slice(0, 5).map((q, idx) => ({
                    questionId: q.id,
                    order: idx,
                })),
            },
        },
    });
    const quiz2 = await prisma.quiz.create({
        data: {
            title: 'Logical Reasoning Practice',
            description: 'Logical reasoning questions for competitive exams',
            category: 'GATE Practice',
            tags: ['Logic', 'GATE', 'Reasoning'],
            difficulty: client_1.Difficulty.MEDIUM,
            visibility: client_1.QuizVisibility.PUBLIC,
            timePerQuestion: 60,
            totalTimeLimit: 1800,
            negativeMarking: 0.25,
            enablePowerUps: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            isPublished: true,
            createdBy: users[1].id,
            questions: {
                create: questions.slice(5, 10).map((q, idx) => ({
                    questionId: q.id,
                    order: idx,
                })),
            },
        },
    });
    const quiz3 = await prisma.quiz.create({
        data: {
            title: 'Mixed Aptitude Challenge',
            description: 'Mixed questions from all topics',
            category: 'Mixed Quiz',
            tags: ['Mixed', 'Challenge', 'All Topics'],
            difficulty: client_1.Difficulty.MEDIUM,
            visibility: client_1.QuizVisibility.PUBLIC,
            timePerQuestion: 90,
            totalTimeLimit: 2400,
            negativeMarking: 0.25,
            enablePowerUps: true,
            adaptiveDifficulty: true,
            isPublished: true,
            createdBy: users[1].id,
            questions: {
                create: questions.slice(0, 10).map((q, idx) => ({
                    questionId: q.id,
                    order: idx,
                })),
            },
        },
    });
    const quiz4 = await prisma.quiz.create({
        data: {
            title: 'Google 2026 Placement Prep',
            description: 'Previous year placement questions for Google',
            category: 'Previous-Year Placement',
            tags: ['Google', 'Placement', '2026', 'Hard'],
            difficulty: client_1.Difficulty.HARD,
            visibility: client_1.QuizVisibility.PUBLIC,
            timePerQuestion: 120,
            totalTimeLimit: 3600,
            negativeMarking: 0.25,
            enablePowerUps: true,
            isPublished: true,
            createdBy: users[1].id,
            questions: {
                create: questions.slice(10, 14).map((q, idx) => ({
                    questionId: q.id,
                    order: idx,
                })),
            },
        },
    });
    console.log('🎯 Creating a room...');
    const room = await prisma.room.create({
        data: {
            code: 'ABC123',
            quizId: quiz1.id,
            hostId: users[1].id,
            collegeId: colleges[0].id,
            joinMode: client_1.RoomJoinMode.ONLINE_LIVE,
            status: client_1.RoomStatus.WAITING,
            maxPlayers: 50,
            allowLateJoin: true,
            requireLogin: false,
            qrRotationInterval: 30,
        },
    });
    await prisma.roomPlayer.createMany({
        data: [
            { roomId: room.id, userId: users[2].id, nickname: 'Aarav', seatNumber: 1 },
            { roomId: room.id, userId: users[3].id, nickname: 'Priya', seatNumber: 2 },
            { roomId: room.id, userId: users[4].id, nickname: 'Rohan', seatNumber: 3 },
        ],
    });
    console.log('📅 Creating daily challenge...');
    await prisma.dailyChallenge.create({
        data: {
            date: new Date(),
            quizId: quiz1.id,
        },
    });
    console.log('✅ Seed completed!');
    console.log(`
  Test Accounts:
  - Super Admin: admin@aptiquiz.com / password123
  - Host: host@niit.com / password123
  - Students: student1@niit.com, student2@niit.com, student3@niit.com / password123
  - College Admin: admin@niit.com / password123
  Room Code: ABC123
  `);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
