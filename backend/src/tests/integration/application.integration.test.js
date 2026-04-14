/**
 * INTEGRATION TESTS — Application API Routes
 *
 * Uses Supertest to exercise the Express router.
 * Controller functions and middleware are mocked so no DB/PDF calls are made.
 * Tests: HTTP verbs, route ordering, status codes, error scenarios.
 */

// ─── Mock controllers ─────────────────────────────────────────────────────────

jest.mock('../../controllers/applicationController.js', () => ({
  applyForInternship: (req, res) =>
    res.status(201).json({ success: true, data: { _id: 'app001', name: req.body.name, status: 'Applied' } }),

  getMyApplications: (req, res) =>
    res.json({ success: true, count: 2, data: [{ _id: 'app001' }, { _id: 'app002' }] }),

  getApplicationById: (req, res) => {
    if (req.params.id === 'notfound') return res.status(404).json({ message: 'Application not found' });
    return res.json({ success: true, data: { _id: req.params.id } });
  },

  updateApplication: (req, res) =>
    res.status(200).json({ message: 'Application updated successfully' }),

  withdrawApplication: (req, res) => {
    if (req.params.id === 'notfound') return res.status(404).json({ message: 'Application not found' });
    if (req.params.id === 'forbidden') return res.status(403).json({ message: 'Not authorized to withdraw this application' });
    return res.json({ success: true, message: 'Application withdrawn successfully' });
  },

  checkApplicationStatus: (req, res) =>
    res.json({ success: true, hasApplied: true, application: { _id: 'app001' } }),

  getApplicationsByInternship: (req, res) =>
    res.json({ success: true, data: [{ _id: 'app001' }, { _id: 'app002' }] }),
}));

// ─── Mock middleware ──────────────────────────────────────────────────────────

jest.mock('../../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'youth123', id: 'youth123', role: 'youth' };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => next(),
}));

jest.mock('../../middleware/uploadCV.js', () => ({
  __esModule: true,
  default:        (req, res, next) => next(),
  flexibleUpload: (req, res, next) => { req.files = []; next(); },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import request from 'supertest';
import express from 'express';
import applicationRouter from '../../routes/applicationRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/applications', applicationRouter);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Application API — Integration Tests', () => {

  // ── POST /api/applications/apply/:internshipId ──────────────────────────────
  describe('POST /api/applications/apply/:internshipId', () => {
    test('201 — submits a new application', async () => {
      const res = await request(app)
        .post('/api/applications/apply/int001')
        .send({ name: 'Alice', email: 'alice@example.com', phoneNumber: '0712345678' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'Applied');
    });

    test('201 — response contains application object', async () => {
      const res = await request(app)
        .post('/api/applications/apply/int002')
        .send({ name: 'Bob', email: 'bob@example.com', phoneNumber: '0770000000' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data._id).toBe('app001');
    });
  });

  // ── GET /api/applications/my-applications ──────────────────────────────────
  describe('GET /api/applications/my-applications', () => {
    test('200 — returns list of my applications', async () => {
      const res = await request(app)
        .get('/api/applications/my-applications')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('200 — data array has correct number of items', async () => {
      const res = await request(app).get('/api/applications/my-applications');
      expect(res.body.data).toHaveLength(2);
    });
  });

  // ── GET /api/applications/check/:internshipId ──────────────────────────────
  describe('GET /api/applications/check/:internshipId', () => {
    test('200 — returns application status check', async () => {
      const res = await request(app)
        .get('/api/applications/check/int001')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('hasApplied');
    });

    test('200 — hasApplied is true when applied', async () => {
      const res = await request(app).get('/api/applications/check/int001');
      expect(res.body.hasApplied).toBe(true);
    });
  });

  // ── GET /api/applications/:id ───────────────────────────────────────────────
  describe('GET /api/applications/:id', () => {
    test('200 — returns specific application by ID', async () => {
      const res = await request(app)
        .get('/api/applications/app001')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('app001');
    });

    test('404 — returns error for non-existent application', async () => {
      const res = await request(app)
        .get('/api/applications/notfound')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  // ── PUT /api/applications/:id ───────────────────────────────────────────────
  describe('PUT /api/applications/:id', () => {
    test('200 — updates existing application', async () => {
      const res = await request(app)
        .put('/api/applications/app001')
        .set('Authorization', 'Bearer mock.token')
        .send({ name: 'Alice Updated', phoneNumber: '0711111111' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated/i);
    });

    test('200 — update with email change', async () => {
      const res = await request(app)
        .put('/api/applications/app001')
        .send({ email: 'newemail@example.com' });

      expect(res.statusCode).toBe(200);
    });
  });

  // ── DELETE /api/applications/:id ───────────────────────────────────────────
  describe('DELETE /api/applications/:id', () => {
    test('200 — withdraws application successfully', async () => {
      const res = await request(app)
        .delete('/api/applications/app001')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/withdrawn/i);
    });

    test('404 — returns error for non-existent application', async () => {
      const res = await request(app)
        .delete('/api/applications/notfound')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(404);
    });

    test('403 — returns error when user not authorized', async () => {
      const res = await request(app)
        .delete('/api/applications/forbidden')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  // ── GET /api/applications/internship/:internshipId ─────────────────────────
  describe('GET /api/applications/internship/:internshipId', () => {
    test('200 — returns applications for an internship (org role)', async () => {
      const res = await request(app)
        .get('/api/applications/internship/int001')
        .set('Authorization', 'Bearer mock.token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('200 — data array has 2 applications', async () => {
      const res = await request(app).get('/api/applications/internship/int001');
      expect(res.body.data).toHaveLength(2);
    });
  });

});
