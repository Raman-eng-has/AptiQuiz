'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CHAPTERS = [
  {
    id: 'ch1',
    number: 'Chapter I',
    title: 'Dice and Cubes',
    category: 'Logical Reasoning',
    summary:
      'A cube is a 3D shape with equal length, breadth, and height, 6 faces, 8 corners, and 12 edges. Only three sides ("Joint Sides") can be seen at once and cannot be opposite each other.',
    formulas: [
      'If a painted cube is divided into N = n³ smaller equal-sized cubes (where n = segments per edge):',
      '1. Smaller cubes with 0 faces painted (inner core) = (n - 2)³',
      '2. Smaller cubes with 1 face painted (face centers) = 6 × (n - 2)²',
      '3. Smaller cubes with 2 faces painted (along 12 edges) = 12 × (n - 2)',
      '4. Smaller cubes with 3 faces painted (corners) = 8 (always constant for n ≥ 2)',
      'Standard Dice: Opposite faces always sum to 7 (1 ↔ 6, 2 ↔ 5, 3 ↔ 4).',
      'Open Dice Rule: Along any straight line of squares in an unfolded net, alternate faces oppose each other.',
    ],
    example: {
      q: 'A cube with blue paint on its face is divided into 125 equal-sized cubes. How many cubes have (i) no face painted, and (ii) a single face painted?',
      a: 'Here n³ = 125 ⇒ n = 5.\n(i) 0 faces painted = (n - 2)³ = (5 - 2)³ = 27.\n(ii) 1 face painted = 6 × (n - 2)² = 6 × (5 - 2)² = 54.',
    },
  },
  {
    id: 'ch2',
    number: 'Chapter II',
    title: 'Order and Ranking',
    category: 'Logical Reasoning',
    summary:
      'Order and Ranking evaluates relative positions using inequality comparison chains (A > B > C), top/bottom rank conversions, and position interchanges.',
    formulas: [
      '1. Total persons in a row = (Rank from Left/Top) + (Rank from Right/Bottom) - 1',
      '2. Rank from Bottom = Total - (Rank from Top) + 1',
      '3. Non-Overlapping Persons Between A & B (when L + R < Total) = Total - (L + R)',
      '4. Position Interchange Total = (New Position of A from Left) + (Old Position of B from Right) - 1',
    ],
    example: {
      q: 'In a competition of 100 participants, A ranked 15th from top and B ranked 25th from bottom. If C ranked exactly between A and B, what is C’s rank from top?',
      a: 'A’s rank from top = 15. B’s rank from top = 100 - 25 + 1 = 76. Midpoint = (15 + 76) / 2 = 45.5 → 46th from top.',
    },
  },
  {
    id: 'ch3',
    number: 'Chapter III',
    title: 'Analytical & Number Puzzles',
    category: 'Logical Reasoning',
    summary:
      'Puzzles test logical synthesis of unordered raw clues into structured tables, number patterns, clock progressions, and multi-attribute grids.',
    formulas: [
      '1. Number Triangles / Circles: Check (Left × Right + Bottom), (a² - b²), or cube/square series (1³, 2³, 3³, 4³).',
      '2. Alphanumeric Grids: Track letter step increments (+2, +3) independently from subscript arithmetic (Col 1 + Col 2 = Col 3).',
      '3. Multi-Variable Elimination: Build a grid of Person × City × Profession × Spouse and place definite positive clues first, then use negative clues to eliminate options.',
    ],
    example: {
      q: 'In a number tree: (12, 8) → 80; (16, 7) → 207; (25, 21) → ?. Find ?',
      a: 'Rule: Bottom = Left² - Right². Check: 12² - 8² = 144 - 64 = 80; 16² - 7² = 256 - 49 = 207. Thus 25² - 21² = 625 - 441 = 184.',
    },
  },
  {
    id: 'ch4',
    number: 'Chapter IV',
    title: 'Syllogism (Venn Diagrams & Possibility)',
    category: 'Logical Reasoning',
    summary:
      'Deductive logic from given statements disregarding commonly known facts using Euler/Venn circles and complementary Either-Or pairs.',
    formulas: [
      '1. Positive Statements Only ⇒ Any negative definite conclusion is automatically FALSE.',
      '2. All A is B ⇒ "Some A is B" and "Some B is A" are definitely TRUE.',
      '3. No A is B ⇒ "No B is A", "Some A is not B", and "Some B is not A" are definitely TRUE.',
      '4. Complementary Pairs for Either-Or: ("Some A are B" + "No A is B") OR ("All A are B" + "Some A are not B") when both are individually doubtful and share the same subject/predicate.',
      '5. Possibility Rule: If no definite relation exists between two elements, any "Some / All ... is a Possibility" conclusion is TRUE.',
    ],
    example: {
      q: 'Statements: Some Cameras are Radios. Some Statues are Cameras. Conclusions: I. Some Radios are Statues. II. No Radio is a Statue.',
      a: 'No direct relation between Radios and Statues, so both I and II are individually false. Since one is "Some" (positive) and one is "No" (negative) with the same terms, Either I or II follows.',
    },
  },
  {
    id: 'ch5',
    number: 'Chapter V',
    title: 'Time & Work and Pipes & Cisterns',
    category: 'Quantitative Aptitude',
    summary:
      'Rate of work, LCM unit method, manpower chain rule (MDH), work wages, and inlet/outlet tank filling.',
    formulas: [
      '1. Work = Rate × Time (W = R × T); Combined Time for A and B = (A × B) / (A + B)',
      '2. LCM Method: Assume Total Work = LCM(days). Efficiency = Total Work ÷ Days.',
      '3. MDH Formula: (M₁ × D₁ × H₁ × E₁) / W₁ = (M₂ × D₂ × H₂ × E₂) / W₂',
      '4. Pipes & Cisterns Net Rate = (Sum of Inlet Filling Rates) - (Sum of Outlet Emptying Rates)',
      '5. Work Wages: Total wages are divided strictly in the ratio of total work done (or efficiency if working for the same duration).',
    ],
    example: {
      q: 'A alone can finish a work in 6 days and B alone in 12 days. In how many days can they finish it together?',
      a: 'Total Work = LCM(6, 12) = 12 units. A = 2 u/day, B = 1 u/day. Together = 3 u/day ⇒ Time = 12 / 3 = 4 days.',
    },
  },
  {
    id: 'ch6',
    number: 'Chapter VI',
    title: 'Time, Speed & Distance (Trains & Boats)',
    category: 'Quantitative Aptitude',
    summary:
      'Uniform motion, unit conversions, relative velocity, train crossings, circular tracks, and upstream/downstream boats.',
    formulas: [
      '1. Unit Conversion: 1 km/hr = (5/18) m/s  |  1 m/s = (18/5) km/hr',
      '2. Average Speed for equal distances at speeds x and y = 2xy / (x + y)',
      '3. Relative Speed: Same direction = |S₁ - S₂|  |  Opposite direction = (S₁ + S₂)',
      '4. Train Crossing: Distance = Length of Train (for pole/man) OR (Length of Train + Length of Platform/Bridge/2nd Train).',
      '5. Post-Meeting Theorem: If two trains meet and take t₁ and t₂ hours to reach destinations, Speed₁ / Speed₂ = √(t₂ / t₁).',
      '6. Stoppage Time per hour = ((Speed without stoppages - Speed with stoppages) / Speed without stoppages) × 60 min.',
    ],
    example: {
      q: 'A train running at 90 km/hr passes a pole on the platform in 20 seconds. Find the length of the train.',
      a: 'Speed = 90 × (5/18) = 25 m/s. Length = Speed × Time = 25 × 20 = 500 meters.',
    },
  },
  {
    id: 'ch7',
    number: 'Chapter VII',
    title: 'Business Math (Percentage, Profit/Loss, SI/CI, Ratio & Partnership)',
    category: 'Quantitative Aptitude',
    summary:
      'Commercial arithmetic covering percentage change, cost/selling/marked prices, simple & compound interest, alligation mixtures, and partnerships.',
    formulas: [
      '1. Successive % Change of x% and y% = [x + y + (xy / 100)]%',
      '2. Profit % = ((SP - CP) / CP) × 100  |  SP = MP × (100 - Discount%) / 100',
      '3. Simple Interest (SI) = (P × R × T) / 100  |  Compound Amount A = P × (1 + R/100)ᵀ',
      '4. 2-Year (CI - SI) Difference = P × (R / 100)²',
      '5. Partnership Profit Ratio = (Capital₁ × Time₁) : (Capital₂ × Time₂)',
    ],
    example: {
      q: 'A trader marks his goods 60% above cost and allows a 25% discount. Find his profit percent.',
      a: 'Let CP = 100 ⇒ MP = 160 ⇒ SP = 160 × 0.75 = 120 ⇒ Profit = 20%.',
    },
  },
  {
    id: 'ch8',
    number: 'Chapter VIII',
    title: 'Number System (Factors, Unit Digit, Zeroes & Remainders)',
    category: 'Quantitative Aptitude',
    summary:
      'Prime factorization, total/odd/even/square factors, cyclicity of powers, trailing zeroes in factorials, and modular arithmetic.',
    formulas: [
      '1. If N = pᵃ × qᵇ × rᶜ (prime factorization): Total Factors = (a + 1)(b + 1)(c + 1).',
      '2. Odd Factors (where p = 2): (b + 1)(c + 1)  |  Even Factors = a × (b + 1)(c + 1).',
      '3. Sum of Factors = [(pᵃ⁺¹ - 1)/(p - 1)] × [(qᵇ⁺¹ - 1)/(q - 1)] ...',
      '4. Trailing Zeroes in n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ...',
      '5. Algebraic Divisibility: (xⁿ - aⁿ) is divisible by (x - a) for all n; (xⁿ + aⁿ) is divisible by (x + a) for odd n.',
      '6. Last Two Digits of (...a1)bc: Unit digit = 1, Tens digit = unit digit of (a × c).',
    ],
    example: {
      q: 'Find the total number of factors of 720 and trailing zeroes in 256!.',
      a: '720 = 2⁴ × 3² × 5¹ ⇒ Factors = (4+1)(2+1)(1+1) = 30.\nZeroes in 256! = ⌊256/5⌋ + ⌊256/25⌋ + ⌊256/125⌋ = 51 + 10 + 2 = 63.',
    },
  },
  {
    id: 'ch9',
    number: 'Chapter IX',
    title: 'Data & Seating Arrangement',
    category: 'Logical Reasoning',
    summary:
      'Linear rows, dual parallel rows (North vs South), circular/square tables, and multi-floor/flat matrix puzzles.',
    formulas: [
      '1. Circular Facing Center: Left = Clockwise, Right = Counter-Clockwise.',
      '2. Parallel Rows: Row 1 facing South (Left is East, Right is West); Row 2 facing North (Left is West, Right is East).',
      '3. Floor & Flat Matrix: Draw floors from N (top) down to 1 (ground) with columns for Flat A (West) and Flat B (East). Place fixed positions first.',
    ],
    example: {
      q: 'Five girls sit on a bench: Seema is left of Rani and right of Bindu. Mary is right of Rani. Reeta is between Rani and Mary. Who is in the middle?',
      a: 'Order from left to right: Bindu - Seema - Rani - Reeta - Mary. Rani is in the middle.',
    },
  },
  {
    id: 'ch10',
    number: 'Chapter X',
    title: 'Non-Verbal Reasoning',
    category: 'Logical Reasoning',
    summary:
      'Analytical figure counting (triangles, squares, rectangles, parallelograms, 3D cubes), mirror/water images, paper folding, and figure matrices.',
    formulas: [
      '1. Triangles in a Square with Diagonals: If divided into n radial segments, Total Triangles = 2 × n.',
      '2. Parallelograms / Rectangles in an m × n Grid = [m(m + 1) / 2] × [n(n + 1) / 2].',
      '3. Mirror Image (Vertical Mirror): Left ↔ Right reverses (lateral inversion); Top ↔ Bottom stays unchanged.',
      '4. Water Image (Horizontal Mirror): Top ↔ Bottom flips (vertical inversion); Left-to-Right order stays unchanged.',
    ],
    example: {
      q: 'How many parallelograms are in a 2 × 3 grid, and how many triangles in a square with 8 inner radial segments?',
      a: 'Parallelograms = [2×3/2] × [3×4/2] = 3 × 6 = 18.\nTriangles = 2 × 8 = 16.',
    },
  },
];

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredChapters =
    selectedCategory === 'ALL'
      ? CHAPTERS
      : CHAPTERS.filter((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="badge-primary mb-2">NIET Department of Training & Development</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Aptitude Key Concepts, Formulas & Study Guide
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete 10-chapter formula reference, shortcut tactics, and worked examples from the NIET Aptitude Handbook.
            </p>
          </div>
          <Link href="/quiz/explore" className="btn-primary py-2.5 px-5 text-sm self-start md:self-auto">
            🎯 Practice All 10 Chapter Quizzes →
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Logical Reasoning', 'Quantitative Aptitude'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat === 'ALL' ? 'All 10 Chapters' : cat}
            </button>
          ))}
        </div>

        {/* Chapters Grid */}
        <div className="space-y-6">
          {filteredChapters.map((ch) => (
            <div key={ch.id} className="card p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-extrabold uppercase">
                    {ch.number}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                    {ch.title}
                  </h2>
                </div>
                <span className="badge-primary">{ch.category}</span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {ch.summary}
              </p>

              {/* Formulas & Rules Box */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  📐 Core Formulas & Fundamental Rules
                </h3>
                <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
                  {ch.formulas.map((f, i) => (
                    <li key={i} className="leading-relaxed">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Worked Example Box */}
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-1.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  💡 Worked Example & Step-by-Step Solution
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Q: {ch.example.q}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  <strong>Solution:</strong> {ch.example.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform Guide Section */}
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Platform Guide: Live Multiplayer & Solo Practice
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white">1. Solo Practice & Solutions</h3>
              <p>
                Open <strong>Explore Quizzes</strong> and click <strong>Practice & Solutions</strong> on any module to solve questions with instant step-by-step formula explanations or view the complete worksheet key.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white">2. Live Multiplayer Rooms</h3>
              <p>
                Hosts can launch any NIET module as a real-time multiplayer room with a 6-digit code and QR link. Students join from <strong>/join</strong> and compete on a speed-adjusted leaderboard.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white">3. Strategic Power-Ups</h3>
              <p>
                During live quizzes, use <strong>Double Points (2x)</strong>, <strong>50-50</strong> option elimination, and <strong>Time Freeze (+5s)</strong> to maximize your streak and rating.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
