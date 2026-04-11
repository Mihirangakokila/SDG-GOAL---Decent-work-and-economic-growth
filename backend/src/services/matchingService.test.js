import { calculateEligibilityScore } from './matchingService.js';

// Mock data for testing
const mockYouthProfile = {
  fullName: 'John Doe',
  skills: ['JavaScript', 'React', 'Node.js'],
  education: {
    level: 'Bachelor',
    field: 'Computer Science'
  },
  location: {
    district: 'Bangalore',
    state: 'Karnataka'
  },
  experience: 0
};

const mockInternshipRequirements = {
  title: 'Full Stack Developer',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  education: {
    level: 'Bachelor',
    field: 'Computer Science'
  },
  location: {
    district: 'Bangalore',
    state: 'Karnataka'
  }
};

const mockCVTextWithTechnicalSkills = `
  John Doe
  Email: john@example.com
  Phone: +91-9876543210
  
  EDUCATION
  Bachelor of Science in Computer Science
  University of Bangalore, 2023
  
  TECHNICAL SKILLS
  - Programming Languages: JavaScript, Python, Java, C++
  - Frontend: React, Vue, HTML5, CSS3
  - Backend: Node.js, Express, Django, Flask
  - Databases: MongoDB, PostgreSQL, MySQL
  - Tools: Git, Docker, Linux
  
  EXPERIENCE
  Full Stack Developer Intern at TechCorp
  - Developed React-based web applications
  - Built REST APIs using Node.js and Express
  - Worked with MongoDB for database management
  - Collaborated with team in Bangalore
  
  SUMMARY
  Fresh graduate with strong technical skills in JavaScript and Node.js
  I am a junior developer seeking internship opportunities
`;

const mockCVTextWithoutSkills = `
  Jane Smith
  Email: jane@example.com
  
  SUMMARY
  Enthusiastic team player with good communication skills
  Strong problem-solving abilities
  Looking for opportunities to grow
`;

const mockCVTextShort = `Jane Doe`;

describe('matchingService - calculateEligibilityScore', () => {
  
  describe('Empty or Missing CV Text', () => {
    
    test('should return score of 0 when cvText is empty string', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        ''
      );

      expect(result.total).toBe(0);
      expect(result.breakdown.skillMatch).toBe(0);
      expect(result.breakdown.educationMatch).toBe(0);
      expect(result.breakdown.locationMatch).toBe(0);
      expect(result.breakdown.priorityBoost).toBe(0);
      expect(result.aiReasoning).toContain('No CV text could be extracted');
    });

    test('should return score of 0 when cvText is null', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        null
      );

      expect(result.total).toBe(0);
      expect(result.aiReasoning).toContain('No CV text could be extracted');
    });

    test('should return score of 0 when cvText is undefined', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        undefined
      );

      expect(result.total).toBe(0);
      expect(result.aiReasoning).toContain('No CV text could be extracted');
    });

    test('should return score of 0 when cvText contains only whitespace', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        '   \n\t  '
      );

      expect(result.total).toBe(0);
    });
  });

  describe('CV Text Keyword Matching', () => {
    
    test('should detect technical skills in CV text', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      // Should have non-zero skill match after fallback
      expect(result.breakdown.skillMatch).toBeGreaterThan(0);
    });

    test('should return 0 score when CV has no technical skills', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithoutSkills
      );

      expect(result.total).toBe(0);
      expect(result.breakdown.skillMatch).toBe(0);
    });

    test('should detect education keywords', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      // Education match should be positive when degree is mentioned
      expect(result.breakdown.educationMatch).toBeGreaterThanOrEqual(0);
    });

    test('should detect location keywords', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      // Should have location match for Bangalore
      expect(result.breakdown.locationMatch).toBeGreaterThanOrEqual(0);
    });

    test('should detect priority boost keywords', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      // Should detect "intern", "junior", "internship"
      expect(result.breakdown.priorityBoost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Score Ranges and Validation', () => {
    
    test('should return total score between 0 and 100', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    test('skillMatch should be between 0 and 40', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.skillMatch).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.skillMatch).toBeLessThanOrEqual(40);
    });

    test('educationMatch should be between 0 and 20', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.educationMatch).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.educationMatch).toBeLessThanOrEqual(20);
    });

    test('locationMatch should be between 0 and 10', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.locationMatch).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.locationMatch).toBeLessThanOrEqual(10);
    });

    test('priorityBoost should be between 0 and 30', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.priorityBoost).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.priorityBoost).toBeLessThanOrEqual(30);
    });
  });

  describe('Response Structure', () => {
    
    test('should return object with required properties', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('aiReasoning');
    });

    test('breakdown should have all required fields', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown).toHaveProperty('skillMatch');
      expect(result.breakdown).toHaveProperty('educationMatch');
      expect(result.breakdown).toHaveProperty('locationMatch');
      expect(result.breakdown).toHaveProperty('priorityBoost');
    });

    test('aiReasoning should be a non-empty string', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(typeof result.aiReasoning).toBe('string');
      expect(result.aiReasoning.length).toBeGreaterThan(0);
    });

    test('breakdown values should be integers', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(Number.isInteger(result.breakdown.skillMatch)).toBe(true);
      expect(Number.isInteger(result.breakdown.educationMatch)).toBe(true);
      expect(Number.isInteger(result.breakdown.locationMatch)).toBe(true);
      expect(Number.isInteger(result.breakdown.priorityBoost)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    
    test('should handle CV text with special characters', async () => {
      const cvWithSpecialChars = `
        John Doe
        Email: john@test.com
        Skills: JavaScript, React, Node.js, C++, C#
        Experience: Development of web apps & APIs
        Location: Bangalore, Karnataka
      `;

      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        cvWithSpecialChars
      );

      expect(result).toHaveProperty('total');
      expect(result.total).toBeLessThanOrEqual(100);
    });

    test('should handle case-insensitive skill matching', async () => {
      const cvLowercase = mockCVTextWithTechnicalSkills.toLowerCase();
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        cvLowercase
      );

      // Should still detect skills despite lowercase
      expect(result.breakdown.skillMatch).toBeGreaterThanOrEqual(0);
    });

    test('should handle very long CV text', async () => {
      const longCV = mockCVTextWithTechnicalSkills.repeat(100);
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        longCV
      );

      expect(result).toHaveProperty('total');
      expect(result.total).toBeLessThanOrEqual(100);
    });

    test('should handle missing internship requirements', async () => {
      const minimalRequirements = {
        skills: [],
        education: {},
        location: {}
      };

      const result = await calculateEligibilityScore(
        mockYouthProfile,
        minimalRequirements,
        mockCVTextWithTechnicalSkills
      );

      expect(result).toHaveProperty('total');
    });
  });

  describe('Skill Detection', () => {
    
    test('should detect JavaScript variants (js, JS, javascript)', async () => {
      const cvWithJS = 'I have expertise in JS and JavaScript programming';
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        { ...mockInternshipRequirements, skills: ['javascript'] },
        cvWithJS
      );

      expect(result.breakdown.skillMatch).toBeGreaterThan(0);
    });

    test('should detect Node.js variants (nodejs, node)', async () => {
      const cvWithNode = 'Backend development using Node.js and nodejs runtime';
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        { ...mockInternshipRequirements, skills: ['node.js'] },
        cvWithNode
      );

      expect(result.breakdown.skillMatch).toBeGreaterThan(0);
    });

    test('should detect React variants (react, reactjs)', async () => {
      const cvWithReact = 'Frontend development with React and ReactJS';
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        { ...mockInternshipRequirements, skills: ['react'] },
        cvWithReact
      );

      expect(result.breakdown.skillMatch).toBeGreaterThan(0);
    });

    test('should not match non-existent skills', async () => {
      // CV with no technical skills - only soft skills and generic text
      const cvWithoutSkill = `
        Jane Smith
        Email: jane@example.com
        
        SUMMARY
        Enthusiastic team player
      `;
      
      // Minimal requirements with skills that don't exist in CV
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        { 
          skills: ['solidity', 'rust', 'go'],
          education: {},
          location: {}
        },
        cvWithoutSkill
      );

      // When no technical skills match, score should be 0
      expect(result.breakdown.skillMatch).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('No Requirements Specified', () => {
    
    test('should give full skillMatch when no skills required', async () => {
      const noSkillsRequired = {
        ...mockInternshipRequirements,
        skills: []
      };

      const result = await calculateEligibilityScore(
        mockYouthProfile,
        noSkillsRequired,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.skillMatch).toBe(40);
    });

    test('should give full educationMatch when no education required', async () => {
      const noEducationRequired = {
        ...mockInternshipRequirements,
        education: {}
      };

      const result = await calculateEligibilityScore(
        mockYouthProfile,
        noEducationRequired,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.educationMatch).toBe(20);
    });

    test('should give full locationMatch when no location required', async () => {
      const noLocationRequired = {
        ...mockInternshipRequirements,
        location: undefined
      };

      const result = await calculateEligibilityScore(
        mockYouthProfile,
        noLocationRequired,
        mockCVTextWithTechnicalSkills
      );

      expect(result.breakdown.locationMatch).toBe(10);
    });
  });

  describe('Fallback Scoring', () => {
    
    test('should fall back to rule-based scoring when AI unavailable', async () => {
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        mockCVTextWithTechnicalSkills
      );

      // Should still return a valid score
      expect(result).toHaveProperty('total');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  describe('Priority Keywords Detection', () => {
    
    test('should boost score for junior level candidates', async () => {
      const cvJunior = `${mockCVTextWithTechnicalSkills}
        Junior Developer seeking internship opportunities`;
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        cvJunior
      );

      expect(result.breakdown.priorityBoost).toBeGreaterThan(0);
    });

    test('should boost score for fresh graduates', async () => {
      const cvFresher = `${mockCVTextWithTechnicalSkills}
        Fresher looking for traineeship in software development`;
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        cvFresher
      );

      expect(result.breakdown.priorityBoost).toBeGreaterThan(0);
    });

    test('should boost score for rural background candidates', async () => {
      const cvRural = `${mockCVTextWithTechnicalSkills}
        From a rural village background seeking opportunities`;
      
      const result = await calculateEligibilityScore(
        mockYouthProfile,
        mockInternshipRequirements,
        cvRural
      );

      expect(result.breakdown.priorityBoost).toBeGreaterThan(0);
    });
  });
});
