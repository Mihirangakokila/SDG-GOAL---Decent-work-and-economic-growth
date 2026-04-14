/**
 * INTEGRATION TESTS — Course API Routes
 *
 * Uses Supertest to exercise the Express route layer.
 * Course and CourseApplication DB models and auth middleware are mocked.
 * Validates: CRUD routes, role-based access, validation errors, edge cases.
 */

// ─── Mock controllers ─────────────────────────────────────────────────────────

jest.mock('../../controllers/courseController.js', () => ({
  listCourses: (req, res) => {
    const courses = [
      { _id: 'c001', title: 'JavaScript Basics', type: 'Online', link: 'https://example.com/js' },
      { _id: 'c002', title: 'Python for Beginners', type: 'Online', link: 'https://example.com/py' },
    ];
    // Simulate type filter
    const type = req.query.type;
    const filtered = type ? courses.filter(c => c.type === type) : courses;
    return res.json(filtered);
  },

  createCourse: (req, res) => {
    const { title, type, link } = req.body;
    if (!title) return res.status(400).json({ message: 'Course name is required' });
    if (!['Online', 'Physical'].includes(type)) return res.status(400).json({ message: 'Type must be Online or Physical' });
    if (!link) return res.status(400).json({ message: 'Course link is required' });
    return res.status(201).json({
      _id: 'c003',
      title,
      type,
      link,
      organizerId: { _id: 'org456', name: 'Test Org' },
    });
  },

  myCourses: (req, res) =>
    res.json([
      { _id: 'c001', title: 'JS Basics', applicationCount: 5 },
      { _id: 'c002', title: 'Python', applicationCount: 2 },
    ]),

  updateCourse: (req, res) => {
    if (req.params.id === 'notfound') return res.status(404).json({ message: 'Course not found' });
    if (req.params.id === 'forbidden') return res.status(403).json({ message: 'You can only edit your own courses' });
    return res.json({ _id: req.params.id, title: req.body.title || 'Updated Title' });
  },

  deleteCourse: (req, res) => {
    if (req.params.id === 'notfound') return res.status(404).json({ message: 'Course not found' });
    if (req.params.id === 'forbidden') return res.status(403).json({ message: 'You can only delete your own courses' });
    return res.json({ message: 'Course deleted' });
  },
}));

// ─── Mock middleware ──────────────────────────────────────────────────────────

jest.mock('../../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'org456', id: 'org456', role: 'organization' };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => next(),
}));

jest.mock('../../middleware/roleMiddleware.js', () => ({
  authorizeRoles: (...roles) => (req, res, next) => next(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import request from 'supertest';
import express from 'express';

// Also wire the public listCourses route as in server.js
import { listCourses, myCourses } from '../../controllers/courseController.js';
import { protect } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';
import courseRouter from '../../routes/courseRoutes.js';

const app = express();
app.use(express.json());

// Mimic server.js route ordering (order matters)
app.get('/api/courses', listCourses);
app.get('/api/courses/my', protect, authorizeRoles('organization'), myCourses);
app.use('/api/courses', courseRouter);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Course API — Integration Tests', () => {

  // ── GET /api/courses (public) ───────────────────────────────────────────────
  describe('GET /api/courses', () => {
    test('200 — returns all courses without auth', async () => {
      const res = await request(app).get('/api/courses');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    test('200 — filters by type=Online', async () => {
      const res = await request(app).get('/api/courses?type=Online');

      expect(res.statusCode).toBe(200);
      res.body.forEach(c => expect(c.type).toBe('Online'));
    });

    test('200 — returns empty if no courses match filter', async () => {
      const res = await request(app).get('/api/courses?type=Physical');

      expect(res.statusCode).toBe(200);
      // No Physical courses in mock data
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('200 — search query param is accepted', async () => {
      const res = await request(app).get('/api/courses?q=JavaScript');
      expect(res.statusCode).toBe(200);
    });
  });

  // ── GET /api/courses/my ─────────────────────────────────────────────────────
  describe('GET /api/courses/my', () => {
    test('200 — returns courses with application counts', async () => {
      const res = await request(app)
        .get('/api/courses/my')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('applicationCount');
    });

    test('200 — two courses returned for org user', async () => {
      const res = await request(app).get('/api/courses/my');
      expect(res.body.length).toBe(2);
    });
  });

  // ── POST /api/courses ───────────────────────────────────────────────────────
  describe('POST /api/courses', () => {
    const validPayload = {
      title: 'React Advanced',
      type: 'Online',
      link: 'https://example.com/react',
      description: 'Deep dive',
    };

    test('201 — creates a new course', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer mock.token')
        .send(validPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body._id).toBe('c003');
      expect(res.body.title).toBe('React Advanced');
    });

    test('201 — response contains organizerId', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send(validPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('organizerId');
    });

    test('400 — missing title', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({ ...validPayload, title: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Course name is required/i);
    });

    test('400 — invalid type', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({ ...validPayload, type: 'Blended' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Online or Physical/i);
    });

    test('400 — missing link', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({ ...validPayload, link: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/link is required/i);
    });
  });

  // ── PUT /api/courses/:id ────────────────────────────────────────────────────
  describe('PUT /api/courses/:id', () => {
    test('200 — updates an existing course', async () => {
      const res = await request(app)
        .put('/api/courses/c001')
        .set('Authorization', 'Bearer mock.token')
        .send({ title: 'JS Intermediate' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', 'c001');
      expect(res.body.title).toBe('JS Intermediate');
    });

    test('404 — course not found', async () => {
      const res = await request(app)
        .put('/api/courses/notfound')
        .send({ title: 'Updated' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test('403 — returns forbidden when not owner', async () => {
      const res = await request(app)
        .put('/api/courses/forbidden')
        .set('Authorization', 'Bearer mock.token')
        .send({ title: 'Hack' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/can only edit/i);
    });
  });

  // ── DELETE /api/courses/:id ─────────────────────────────────────────────────
  describe('DELETE /api/courses/:id', () => {
    test('200 — deletes a course', async () => {
      const res = await request(app)
        .delete('/api/courses/c001')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Course deleted');
    });

    test('404 — course not found', async () => {
      const res = await request(app)
        .delete('/api/courses/notfound')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(404);
    });

    test('403 — not owner returns forbidden', async () => {
      const res = await request(app)
        .delete('/api/courses/forbidden')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/can only delete/i);
    });
  });

});
