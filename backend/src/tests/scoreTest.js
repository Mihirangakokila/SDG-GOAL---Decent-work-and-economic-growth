// Quick test to verify the scoring logic works correctly
// Run with: node src/tests/scoreTest.js

import dotenv from 'dotenv';
dotenv.config();

import { calculateEligibilityScore } from '../services/matchingService.js';

// ─── Test Data ───────────────────────────────────────────────────────────────

const internshipRequirements = {
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  education: { level: 'Bachelor', field: 'Computer Science' },
  location: { district: 'Colombo', state: 'Western Province' },
};

const youthProfile = {
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  education: { level: 'Bachelor', field: 'Computer Science' },
  location: { district: 'Colombo', state: 'Western Province', isRural: true },
  incomeCriteria: { meetsCriteria: true },
};

// ─── Test Cases ──────────────────────────────────────────────────────────────

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CV ELIGIBILITY SCORING — TEST SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  // TEST 1: Perfect match CV
  const goodCV = `
    Experienced JavaScript developer with expertise in React and Node.js.
    Built full-stack applications using MongoDB. Bachelor's degree in
    Computer Science. Located in Colombo, Western Province. Seeking
    internship opportunity as a junior developer from a rural background.
  `;

  const result1 = await calculateEligibilityScore(youthProfile, internshipRequirements, goodCV);
  console.log('TEST 1 — Perfect Match CV:');
  console.log('  Total:', result1.total);
  console.log('  Breakdown:', result1.breakdown);
  console.log('  Reasoning:', result1.aiReasoning);
  console.log('  Expected: High score (70–100)\n');

  // TEST 2: Empty CV text → should be 0
  const result2 = await calculateEligibilityScore(youthProfile, internshipRequirements, '');
  console.log('TEST 2 — Empty CV (no text extracted):');
  console.log('  Total:', result2.total);
  console.log('  Expected: 0\n');

  // TEST 3: Irrelevant text (cooking recipe)
  const badCV = `
    This document is about cooking recipes. How to make pasta:
    Boil water, add salt, cook for 8 minutes. Serve with tomato sauce.
  `;

  const result3 = await calculateEligibilityScore(youthProfile, internshipRequirements, badCV);
  console.log('TEST 3 — Irrelevant CV (cooking recipe):');
  console.log('  Total:', result3.total);
  console.log('  Breakdown:', result3.breakdown);
  console.log('  Reasoning:', result3.aiReasoning);
  console.log('  Expected: 0 (no technical skills)\n');

  // TEST 4: Partial match — some skills only
  const partialCV = `
    Frontend developer experienced with React and JavaScript.
    Currently studying diploma in web development.
    Based in Kandy, Sri Lanka. Looking for internship.
  `;

  const result4 = await calculateEligibilityScore(youthProfile, internshipRequirements, partialCV);
  console.log('TEST 4 — Partial Match (2/4 skills):');
  console.log('  Total:', result4.total);
  console.log('  Breakdown:', result4.breakdown);
  console.log('  Reasoning:', result4.aiReasoning);
  console.log('  Expected: Medium score (30–60)\n');

  // TEST 5: Alias matching — uses "JS" and "NodeJS" instead of full names
  const aliasCV = `
    Full stack developer. Proficient in JS, NodeJS, ReactJS and Mongo.
    B.Tech in Computer Science from State University.
    Colombo, Sri Lanka. Seeking junior developer position.
  `;

  const result5 = await calculateEligibilityScore(youthProfile, internshipRequirements, aliasCV);
  console.log('TEST 5 — Alias Matching (JS, NodeJS, ReactJS):');
  console.log('  Total:', result5.total);
  console.log('  Breakdown:', result5.breakdown);
  console.log('  Reasoning:', result5.aiReasoning);
  console.log('  Expected: High score (should match through aliases)\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  ALL TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

runTests().catch(console.error);
