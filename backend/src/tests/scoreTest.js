import dotenv from 'dotenv';
dotenv.config();

import { calculateEligibilityScore } from '../services/matchingService.js';

// ─── Test Data ───────────────────────────────────────────────────────────────

const itInternship = {
  skills: ['JavaScript', 'React', 'Node.js'],
  education: { level: 'Degree' },
  location: { district: 'Colombo' },
};

const businessInternship = {
  skills: ['Marketing', 'SEO', 'Sales'],
  education: { level: 'Diploma' },
  location: { district: 'Kandy' },
};

const youthProfile = {
  skills: ['JavaScript', 'React', 'Node.js', 'Marketing'],
  education: { level: 'Degree' },
  location: { district: 'Colombo', isRural: false },
};

// ─── Test Cases ──────────────────────────────────────────────────────────────

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CV MATCHING SCORING TEST SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  // TEST 1: IT Match
  const itCV = `
    Experienced JavaScript developer with expertise in React and Node.js.
    I hold a Bachelor Degree in Computer Science. 
    Located in Colombo. Seeking an internship opportunity.
  `;

  console.log('TEST 1 — IT Perfect Match CV:');
  const result1 = await calculateEligibilityScore(youthProfile, itInternship, itCV);
  console.log('  Total:', result1.total);
  console.log('  Breakdown:', result1.breakdown);
  console.log('  Reasoning:', result1.aiReasoning);
  console.log('\n');

  // TEST 2: Business Match
  const businessCV = `
    Passionate about Marketing and SEO.
    I have a Diploma in Business Management.
    Based in Kandy. Looking for entry level marketing roles.
    I am good at sales and communication.
  `;

  console.log('TEST 2 — Business Partial Match:');
  const result2 = await calculateEligibilityScore(youthProfile, businessInternship, businessCV);
  console.log('  Total:', result2.total);
  console.log('  Breakdown:', result2.breakdown);
  console.log('  Reasoning:', result2.aiReasoning);
  console.log('\n');

  // TEST 3: Architecture match
  const archInternship = {
    skills: ['AutoCAD', 'SketchUp', '3D Modeling'],
    education: { level: 'Diploma' },
    location: { district: 'Galle' },
  };

  const archCV = `
    Urban planner and designer. Proficient in AutoCAD and Revit.
    Also experienced in SketchUp for 3D Modeling.
    Passed Advanced Level (A/L) and currently seeking a Diploma.
    Living in Galle.
  `;
  console.log('TEST 3 — Architecture Match:');
  const result3 = await calculateEligibilityScore(youthProfile, archInternship, archCV);
  console.log('  Total:', result3.total);
  console.log('  Breakdown:', result3.breakdown);
  console.log('  Reasoning:', result3.aiReasoning);
  console.log('\n');

  // TEST 4: Arts match
  const artsInternship = {
    skills: ['Photoshop', 'Illustrator', 'Graphic Design'],
    education: { level: 'O/L' },
    location: { district: 'Matara' },
  };

  const artsCV = `
    Creative artist who loves Graphic Design.
    Advanced knowledge in Adobe Photoshop and Illustrator.
    Finished Ordinary Level (O/L) examinations.
    Residing in Matara.
  `;
  console.log('TEST 4 — Arts Match:');
  const result4 = await calculateEligibilityScore(youthProfile, artsInternship, artsCV);
  console.log('  Total:', result4.total);
  console.log('  Breakdown:', result4.breakdown);
  console.log('  Reasoning:', result4.aiReasoning);
  console.log('\n');

}

runTests().catch(console.error);
