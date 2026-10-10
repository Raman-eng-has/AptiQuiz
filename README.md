# AptiQuiz

A real-time multiplayer aptitude quiz platform for college students.

## Overview

AptiQuiz enables up to 50 students to join a room and race through aptitude, logic, verbal, and data-interpretation questions simultaneously. Features live leaderboards, scoring that rewards accuracy and speed, league systems, and comprehensive analytics.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Next.js)     │     │   (Node.js)     │     │   (Primary DB)  │
│   Port 3000     │     │   Port 4000     │     │   Port 5432     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌─────────────┐           ┌─────────────┐
            │   Redis     │           │  Socket.IO  │
            │  (Cache/    │           │  (Real-time)│
            │  Sessions)  │           │             │
            │  Port 6379  │           └─────────────┘
            └─────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### One-Command Setup

```bash
# Clone and navigate
cd AptiQuiz

# Copy environment file
cp .env.example .env

# Start databases
npm run docker:up

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with test data
npm run db:seed

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- WebSocket: ws://localhost:4000

### Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@aptiquiz.com | password123 |
| Host | host@niit.com | password123 |
| Student 1 | student1@niit.com | password123 |
| Student 2 | student2@niit.com | password123 |
| Student 3 | student3@niit.com | password123 |
| College Admin | admin@niit.com | password123 |

**Room Code:** `ABC123`

## Scoring Rules

### Base Points by Difficulty
- Easy: 100 points
- Medium: 150 points
- Hard: 200 points

### Speed Bonus
```
Speed Bonus = Base Points × 0.5 × (Time Remaining / Time Limit)
```
Measured by server receive time relative to server question start.

### Streak Bonus
- +10% per consecutive correct answer
- Capped at +50% (5+ streak)

### Power-ups
- **Double Points**: 2× points for that question
- **50-50**: Removes two wrong options
- **Time Freeze**: +5 seconds (not on last question)

### Negative Marking
Optional per quiz (default 0%, host can set -25%)

## Network Delay Handling

### Latency Compensation
1. **RTT Measurement**: Each player's round-trip time measured via Socket.IO ping/pong
2. **One-way Estimate**: RTT / 2
3. **Elapsed Calculation**: `Server Receive Time - Question Start Time - One-way Latency`
4. **Latency Credit**: Clamped to maximum 300ms credit (prevents fake lag advantage)

### Grace Window
- 500ms after question end accepted if client-reported send time consistent with server timeline
- Otherwise rejected

### Tie-Breaking
- Deterministic: Server arrival order using monotonic clock
- Then by answer sequence ID

### Idempotency
- Each answer carries unique sequence ID
- Only first valid answer per player per question counts
- Duplicates ignored

## Reconnection Design

- Session token per player (JWT in socket auth)
- On reconnect: player rejoins with same score, streak, power-ups
- Sees current question with correct remaining time
- If already answered: "Answer locked" shown
- Other players see small "reconnecting" indicator only
- Host sees connection status in real-time

## Anti-Cheat Measures

### Server-Side (Enforced)
- Correct answers never sent before round ends
- Per-player shuffled options and question order
- Parameterized numbers per player
- Random question pools in self-paced mode
- One account, one seat per room
- Rate limiting on all socket events
- Timing analysis: flags answers too fast to read
- Statistical anomaly detection
- Signed answers, TLS only, input validation

### Client-Side (Deterrents)
- Fullscreen request
- Tab/window visibility & focus-loss detection
- DevTools detection (heuristic)
- Block right-click, copy, paste, text selection
- Watermark question screen with player ID
- Blur question on tab blur
- Fair Play Pledge acceptance required

### Fair Play Browser Extension (Optional)
- Manifest V3 extension for Chrome/Edge/Firefox
- Reports active tab changes during quiz
- Detects other tabs/windows opened during quiz
- Blocks clipboard reads on quiz tab
- Signed heartbeat to server
- Missing heartbeat = flagged
- Privacy-minimal: only active during quiz

### Integrity Score
- 0-100 score from combined signals
- Host sees flag list with evidence
- Actions: Warning, Score Deduction, Exclude from League
- Never auto-bans; informs human decisions

### Honest Limits
> No web app can fully stop a determined cheater with a second device. The strongest defense is physical-presence mode with host supervision, short per-question timers, randomization, and statistical detection.

## Running the 50-Player Load Test

```bash
cd backend
npm run load:test
```

This spawns 50 bots with:
- Random latency (50-800ms)
- Random answer timing
- Disconnect/reconnect events
- Duplicate/late answers

Outputs:
- Total time
- p50/p95 answer latency
- Dropped messages
- Scoring consistency check
- Reconnect success rate

## Demo Script (3 Minutes)

1. **Landing Page** (30s): Show landing, click "Host a Quiz"
2. **Create Quiz** (45s): Build a 5-question quiz, add parameterized question
3. **Create Room** (30s): Generate room, show QR code, copy join link
4. **Join as Students** (45s): Open 2-3 browser tabs/incognito, join with nicknames
5. **Live Play** (45s): Host starts, answer questions, watch live leaderboard animate
6. **Results & Share** (30s): Show final results, share card, profile with badges
7. **Analytics** (15s): Host views question analytics, exports CSV

## Development

### Project Structure
```
AptiQuiz/
├── frontend/          # Next.js 14 + TypeScript + Tailwind + Framer Motion
├── backend/           # Node.js + TypeScript + Express + Socket.IO + Prisma
├── shared/            # Shared types, schemas, constants (Zod)
├── docker-compose.yml # PostgreSQL + Redis
└── package.json       # Root workspace config
```

### Commands
```bash
# Development
npm run dev                 # Start both frontend & backend
npm run dev --workspace=backend
npm run dev --workspace=frontend

# Database
npm run db:generate         # Generate Prisma client
npm run db:push             # Push schema changes
npm run db:migrate          # Run migrations
npm run db:seed             # Seed test data
npm run db:studio           # Open Prisma Studio

# Testing
npm run test                # Run all tests
npm run load:test           # 50-player load test (backend)

# Docker
npm run docker:up           # Start PostgreSQL + Redis
npm run docker:down         # Stop databases
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, PWA
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Prisma ORM
- **Database**: PostgreSQL 16 (primary), Redis 7 (cache/sessions)
- **Auth**: JWT (email/password), OAuth (Google, GitHub, LinkedIn)
- **Testing**: Vitest (unit), Playwright (e2e), Custom load test
- **Deployment**: Docker, Docker Compose

## License

MIT