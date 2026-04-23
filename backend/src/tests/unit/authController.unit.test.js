/**
 * UNIT TESTS — authController.js
 *
 * Strategy: mock mongoose User model + bcryptjs + jsonwebtoken so the
 * controller logic runs in complete isolation (no DB, no real crypto).
 */

// ─── Mock dependencies ────────────────────────────────────────────────────────

jest.mock('../../models/User.js', () => {
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: '$hashed',
    role: 'youth',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  const Model = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };

  return {
    __esModule: true,
    default: Model,
    USER_ROLES: ['youth', 'organization', 'admin'],
  };
});

jest.mock('../../models/YouthProfile.js', () => ({
  __esModule: true,
  default: { findOneAndDelete: jest.fn().mockResolvedValue(null) },
}));

jest.mock('../../models/OrganizationProfile.js', () => ({
  __esModule: true,
  default: { findOneAndDelete: jest.fn().mockResolvedValue(null) },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('$hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked.jwt.token'),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import {
  register,
  login,
  getMe,
  updateMe,
  deleteUser,
} from '../../controllers/authController.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const fakeUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  password: '$hashed_password',
  role: 'youth',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── register ────────────────────────────────────────────────────────────────

describe('authController — register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if required fields are missing', async () => {
    const req = { body: { email: 'test@example.com' } }; // no name, no password
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/required/i) }),
    );
  });

  test('returns 409 if email already exists', async () => {
    User.findOne.mockResolvedValue(fakeUser);
    const req = { body: { name: 'Alice', email: 'test@example.com', password: 'pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/already exists/i) }),
    );
  });

  test('returns 400 if role is invalid', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { name: 'Alice', email: 'new@example.com', password: 'pass123', role: 'superadmin' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid role' }),
    );
  });

  test('returns 201 and token on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(fakeUser);
    const req = { body: { name: 'Alice', email: 'new@example.com', password: 'pass123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mocked.jwt.token' }),
    );
  });

  test('returns 201 with valid role "organization"', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ ...fakeUser, role: 'organization' });
    const req = { body: { name: 'Org', email: 'org@example.com', password: 'pass123', role: 'organization' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 500 on db error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));
    const req = { body: { name: 'Alice', email: 'x@x.com', password: 'pass' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('authController — login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if email or password missing', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 401 if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'nobody@x.com', password: 'pass' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid credentials' }),
    );
  });

  test('returns 401 if password does not match', async () => {
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'test@example.com', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 200 and token on successful login', async () => {
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { email: 'test@example.com', password: 'correct' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mocked.jwt.token', message: 'Logged in successfully' }),
    );
  });

  test('returns 500 on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('Boom'));
    const req = { body: { email: 'x@x.com', password: 'p' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getMe ────────────────────────────────────────────────────────────────────

describe('authController — getMe', () => {
  test('returns 401 if req.user is missing', async () => {
    const req = {};
    const res = mockRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 200 with sanitized user data', async () => {
    const req = { user: fakeUser };
    const res = mockRes();

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ email: 'test@example.com' }) }),
    );
  });
});

// ─── updateMe ─────────────────────────────────────────────────────────────────

describe('authController — updateMe', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 if not authenticated', async () => {
    const req = { body: {} };
    const res = mockRes();

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 400 if nothing to update', async () => {
    const req = { user: fakeUser, body: {} };
    const res = mockRes();

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Nothing to update' }),
    );
  });

  test('returns 200 after updating email', async () => {
    User.findByIdAndUpdate.mockResolvedValue({ ...fakeUser, email: 'new@example.com' });
    const req = { user: fakeUser, body: { email: 'new@example.com' } };
    const res = mockRes();

    await updateMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Profile updated successfully' }),
    );
  });

  test('returns 200 after updating password', async () => {
    User.findByIdAndUpdate.mockResolvedValue(fakeUser);
    const req = { user: fakeUser, body: { password: 'newPass123' } };
    const res = mockRes();

    await updateMe(req, res);

    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe('authController — deleteUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 if not authenticated', async () => {
    const req = { body: {}, params: { id: 'user123' } };
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 403 if non-admin tries to delete another user', async () => {
    const req = {
      user: { ...fakeUser, _id: 'user123', role: 'youth' },
      params: { id: 'otherUser456' },
    };
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('allows user to delete own account', async () => {
    User.findByIdAndDelete.mockResolvedValue(fakeUser);
    const req = {
      user: { ...fakeUser, _id: 'user123', role: 'youth' },
      params: { id: 'user123' },
    };
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
  });

  test('allows admin to delete any account', async () => {
    User.findByIdAndDelete.mockResolvedValue(fakeUser);
    const req = {
      user: { ...fakeUser, _id: 'adminId', role: 'admin' },
      params: { id: 'user123' },
    };
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
