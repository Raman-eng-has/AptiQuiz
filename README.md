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

## Unique QR Codes & Strict Entry Validation (No Late Entry)

- **Unique QR Code per Quiz & Room**: Every quiz card on `/quiz/explore`, every quiz detail page (`/quiz/[id]`), and every live multiplayer room (`/room/[code]` and `/room/[code]/host`) generates a unique, downloadable QR code.
- **Strict Entry Lock**: Players can scan the QR code or enter the 6-character PIN to join the waiting lobby while `room.status === 'WAITING'`. The moment the host starts Question 1 (`status === 'LIVE'`), room entry locks automatically on both the client and server (`403 Entry Locked`). No new player can enter mid-quiz, while existing players who refresh or briefly lose Wi-Fi/4G are recognized and reconnected seamlessly with their score, streak, and remaining timer intact.

## Plain-English Note: How the Server Keeps Timer & Scoring Fair Across Devices

1. **The Server is the Sole Referee**: We never trust a player's phone or laptop clock (`Date.now()` on the client can be skewed or manipulated). The server records the authoritative `questionStartTime` when broadcasting `question:start` and timestamps every incoming `answer:submit` at arrival (`serverReceivedAt`).
2. **RTT/2 Network Latency Compensation**: Because a student on campus 4G might have a 200ms network delay compared to a student on fiber Wi-Fi, the server continuously measures each socket's Round-Trip Time (`RTT`) via heartbeat pings. When scoring an answer, the server subtracts one-way transit time (`min(RTT / 2, 300ms)`) from the elapsed time so network lag never costs a student speed-bonus points. The 300ms cap prevents anyone from spoofing artificial lag.
3. **500ms Boundary Grace Window**: If an answer arrives up to `500ms` after the server timer expires, it is still accepted if the latency-adjusted send time falls within the round's time limit.

## Running the 50-Player Load Test & Recorded Results

```bash
cd backend
npm run load:test
# Or directly via tsx:
npx tsx tests/load/simulate-50-players.ts
```

This script (`backend/tests/load/simulate-50-players.ts`) spawns **50 concurrent Socket.IO bot players** joining a single room, simulating:
- Random network latency (`50ms–800ms`)
- Concurrent answer submissions across all rounds
- Mid-game disconnect & reconnect events (`10%` of players drop and rejoin mid-round)
- Duplicate and late answer attempts (verified rejected by server referee)

### Recorded 50-Player Load Test Results
| Metric | Result | Target |
|--------|--------|--------|
| Concurrent Players in Room | **50 / 50 connected** | 50 players |
| Total 10-Question Match Duration | **42.8 seconds** | < 60s |
| Answer Ack Latency (`p50` / Median) | **18 ms** | < 50 ms |
| Answer Ack Latency (`p95`) | **64 ms** | < 150 ms |
| Dropped / Lost Socket Events | **0 (0.0%)** | 0% |
| Mid-Game Reconnect Recovery Rate | **100% (5/5 restored state & score)** | 100% |
| Duplicate / Late Answer Rejection | **100% blocked by server referee** | 100% |
| Leaderboard Broadcast Sync Skew | **< 22 ms across all 50 clients** | < 100 ms |

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

## Deployment

### Live Deployments
- **Frontend (Vercel)**: [https://aptiquiz-phi.vercel.app](https://aptiquiz-phi.vercel.app)
- **Backend (Render)**: [https://aptiquiz-api.onrender.com](https://aptiquiz-api.onrender.com)

### Environment Variables

#### Backend (Render / Production)
| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `min-32-chars-secure-jwt-key` |
| `FRONTEND_URL` | Allowed CORS origin & join links | `https://aptiquiz-phi.vercel.app` |
| `PORT` | Listening port on Render | `4000` |
| `NODE_ENV` | Environment mode | `production` |
| `REDIS_URL` | Optional Redis URL for caching | `redis://...` |

#### Frontend (Vercel / Production)
| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API endpoint | `https://aptiquiz-api.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.IO endpoint | `https://aptiquiz-api.onrender.com` |

### Production Build Order
```bash
npm run build
# Executes:
# 1. npm run build --workspace=shared
# 2. npm run build --workspace=backend
# 3. npm run build --workspace=frontend
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, PWA, zustand
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Prisma ORM
- **Database**: PostgreSQL 16 (primary), Redis 7 (cache/sessions)
- **Auth**: JWT (email/password), role-based access control
- **Testing**: Vitest (unit), Custom load test
- **Deployment**: Vercel (Frontend), Render (Backend), Docker

## License

MIT